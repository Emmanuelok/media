import dns from "node:dns/promises";
import net from "node:net";
import { ipBlocked, hostAllowed, rewriteHlsPlaylist, isCacheablePlaylist } from "@/lib/proxy";

// Server-side stream proxy. Makes more public live streams playable in-browser by
// adding CORS, upgrading HTTP→HTTPS, and rewriting HLS playlists. Hardened with
// SSRF guards, per-IP rate limiting, an optional host allowlist, and a small
// playlist cache. Pure logic lives in src/lib/proxy.ts (unit-tested).

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

const RPM = Number(process.env.AURORA_PROXY_RPM || 300);
const ALLOWED_HOSTS = (process.env.AURORA_PROXY_ALLOWED_HOSTS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// ---- Rate limiting (per-IP token bucket; best-effort on serverless) ----
const buckets = new Map<string, { tokens: number; ts: number }>();
function rateLimited(ip: string): boolean {
  if (buckets.size > 5000) buckets.clear();
  const now = Date.now();
  const b = buckets.get(ip) || { tokens: RPM, ts: now };
  b.tokens = Math.min(RPM, b.tokens + ((now - b.ts) * RPM) / 60000);
  b.ts = now;
  if (b.tokens < 1) {
    buckets.set(ip, b);
    return true;
  }
  b.tokens -= 1;
  buckets.set(ip, b);
  return false;
}

// ---- Playlist cache (static master / VOD only) ----
const playlistCache = new Map<string, { body: string; exp: number }>();
const PLAYLIST_TTL = 30000;
const CACHE_MAX = 200;
function cacheGet(key: string): string | null {
  const e = playlistCache.get(key);
  if (!e) return null;
  if (Date.now() > e.exp) {
    playlistCache.delete(key);
    return null;
  }
  return e.body;
}
function cacheSet(key: string, body: string) {
  if (playlistCache.size >= CACHE_MAX) {
    const first = playlistCache.keys().next().value;
    if (first) playlistCache.delete(first);
  }
  playlistCache.set(key, { body, exp: Date.now() + PLAYLIST_TTL });
}

async function assertReachable(hostname: string): Promise<void> {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("blocked host");
  }
  if (!hostAllowed(host, ALLOWED_HOSTS)) throw new Error("host not allowed");
  if (net.isIP(host)) {
    if (ipBlocked(host)) throw new Error("blocked host");
    return;
  }
  const addrs = await dns.lookup(host, { all: true });
  if (!addrs.length) throw new Error("unresolved host");
  for (const a of addrs) if (ipBlocked(a.address)) throw new Error("blocked host");
}

async function fetchUpstream(initial: string, range: string | null) {
  let url = initial;
  for (let hop = 0; hop < 5; hop++) {
    await assertReachable(new URL(url).hostname);
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

function err(message: string, status: number, extra?: Record<string, string>) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS, "Content-Type": "application/json", ...extra },
  });
}
function playlistResponse(body: string) {
  return new Response(body, {
    status: 200,
    headers: { ...CORS, "Content-Type": "application/vnd.apple.mpegurl", "Cache-Control": "no-store" },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (rateLimited(ip)) return err("rate limited", 429, { "Retry-After": "5" });

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

  const isM3u8 = /\.m3u8(\?|$)/i.test(parsed.pathname);
  const cacheKey = parsed.toString();
  if (isM3u8) {
    const hit = cacheGet(cacheKey);
    if (hit) return playlistResponse(hit);
  }

  let upstream: Awaited<ReturnType<typeof fetchUpstream>>;
  try {
    upstream = await fetchUpstream(parsed.toString(), req.headers.get("range"));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    const status = /blocked|not allowed/i.test(msg)
      ? 403
      : /invalid|unsupported|redirects/i.test(msg)
        ? 400
        : 502;
    return err(msg, status);
  }

  const { res, finalUrl } = upstream;
  if (!res.ok && res.status !== 206) return err(`upstream responded ${res.status}`, 502);

  const ct = res.headers.get("content-type") || "";
  if (!(MEDIA_EXT.test(parsed.pathname) || MEDIA_CT.test(ct))) {
    return err("not a media resource", 415);
  }

  if (isM3u8 || /mpegurl/i.test(ct)) {
    const rewritten = rewriteHlsPlaylist(await res.text(), finalUrl);
    if (isCacheablePlaylist(rewritten)) cacheSet(cacheKey, rewritten);
    return playlistResponse(rewritten);
  }

  const headers = new Headers(CORS);
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const v = res.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (!headers.has("content-type")) headers.set("content-type", "application/octet-stream");
  headers.set("Cache-Control", res.headers.get("cache-control") || "public, max-age=10");
  return new Response(res.body, { status: res.status, headers });
}
