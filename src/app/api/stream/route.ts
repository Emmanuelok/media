import dns from "node:dns/promises";
import net from "node:net";

// Server-side stream proxy. Makes more public live streams playable in-browser by:
//   1. adding permissive CORS headers (so hls.js can fetch playlists/segments),
//   2. serving HTTP-only origins over our HTTPS endpoint (fixes mixed-content),
//   3. rewriting HLS playlists so nested variant/segment/key URLs route back here.
//
// Because this fetches arbitrary URLs, it is hardened against SSRF: only http(s),
// private/loopback/link-local/metadata IPs blocked (incl. across redirects), and
// only media-looking responses are returned. A production deployment should add
// rate limiting and ideally a CDN-host allowlist or signed URLs on top of this.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
  "Access-Control-Allow-Headers": "Range,Content-Type",
  "Access-Control-Expose-Headers": "Content-Length,Content-Range,Accept-Ranges,Content-Type",
};

const MEDIA_EXT =
  /\.(m3u8|ts|aac|mp3|m4s|mp4|m4a|m4v|mov|key|vtt|webvtt|cmfv|cmfa|cmft|fmp4|mpd|jpg|jpeg|png|webp|gif)(\?|$)/i;
const MEDIA_CT = /(mpegurl|octet-stream|^audio\/|^video\/|mp2t|dash\+xml|^image\/|text\/vtt)/i;
const REDIRECTS = new Set([301, 302, 303, 307, 308]);

function ipBlocked(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local + cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::") return true;
    if (v.startsWith("fc") || v.startsWith("fd")) return true; // unique local
    if (v.startsWith("fe80")) return true; // link-local
    if (v.startsWith("::ffff:")) return ipBlocked(v.slice(7)); // IPv4-mapped
    return false;
  }
  return true; // unknown → block
}

async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("blocked host");
  }
  if (net.isIP(host)) {
    if (ipBlocked(host)) throw new Error("blocked host");
    return;
  }
  const addrs = await dns.lookup(host, { all: true });
  if (!addrs.length) throw new Error("unresolved host");
  for (const a of addrs) if (ipBlocked(a.address)) throw new Error("blocked host");
}

const proxy = (u: string) => `/api/stream?url=${encodeURIComponent(u)}`;
const absolute = (u: string, base: string) => {
  try {
    return new URL(u, base).toString();
  } catch {
    return u;
  }
};
const URI_ATTR = /URI="([^"]*)"/g;

/** Rewrite all child URLs in an HLS playlist to route back through this proxy. */
function rewritePlaylist(text: string, base: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => {
      const t = line.trim();
      if (!t) return line;
      if (t.startsWith("#")) {
        return t.includes('URI="')
          ? line.replace(URI_ATTR, (_m, u) => `URI="${proxy(absolute(u, base))}"`)
          : line;
      }
      return proxy(absolute(t, base)); // variant playlist or segment URL
    })
    .join("\n");
}

async function fetchUpstream(initial: string, range: string | null) {
  let url = initial;
  for (let hop = 0; hop < 5; hop++) {
    await assertPublicHost(new URL(url).hostname);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "manual",
        signal: ctrl.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (AuroraMediaHouse)",
          Accept: "*/*",
          ...(range ? { Range: range } : {}),
        },
      });
    } finally {
      clearTimeout(timer);
    }
    if (REDIRECTS.has(res.status)) {
      const loc = res.headers.get("location");
      if (!loc) return { res, finalUrl: url };
      url = new URL(loc, url).toString();
      continue;
    }
    return { res, finalUrl: url };
  }
  throw new Error("too many redirects");
}

function err(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(req: Request) {
  const target = new URL(req.url).searchParams.get("url");
  if (!target) return err("missing url", 400);

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return err("invalid url", 400);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return err("unsupported scheme", 400);
  }

  let upstream: Awaited<ReturnType<typeof fetchUpstream>>;
  try {
    upstream = await fetchUpstream(parsed.toString(), req.headers.get("range"));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return err(msg, /blocked|invalid|unsupported|redirects/i.test(msg) ? 400 : 502);
  }

  const { res, finalUrl } = upstream;
  if (!res.ok && res.status !== 206) return err(`upstream responded ${res.status}`, 502);

  const ct = res.headers.get("content-type") || "";
  const looksMedia = MEDIA_EXT.test(parsed.pathname) || MEDIA_CT.test(ct);
  if (!looksMedia) return err("not a media resource", 415);

  // HLS playlist → rewrite child URLs through the proxy.
  if (/\.m3u8(\?|$)/i.test(parsed.pathname) || /mpegurl/i.test(ct)) {
    const rewritten = rewritePlaylist(await res.text(), finalUrl);
    return new Response(rewritten, {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/vnd.apple.mpegurl", "Cache-Control": "no-store" },
    });
  }

  // Otherwise stream the bytes through (segments, keys, audio), preserving range.
  const headers = new Headers(CORS);
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const v = res.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (!headers.has("content-type")) headers.set("content-type", "application/octet-stream");
  headers.set("Cache-Control", res.headers.get("cache-control") || "public, max-age=10");
  return new Response(res.body, { status: res.status, headers });
}
