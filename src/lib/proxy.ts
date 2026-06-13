import net from "node:net";

// Pure, server-side helpers for the /api/stream proxy. Kept separate so the
// security-critical logic (SSRF checks, HLS rewriting) can be unit-tested.

/** True if an IP is private/loopback/link-local/reserved (must not be proxied). */
export function ipBlocked(ip: string): boolean {
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

/** When an allowlist is configured, only its host suffixes are permitted. */
export function hostAllowed(host: string, allowed: string[]): boolean {
  if (!allowed.length) return true;
  const h = host.toLowerCase();
  return allowed.some((a) => h === a || h.endsWith("." + a));
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

/** Rewrite all child URLs in an HLS playlist to route back through the proxy. */
export function rewriteHlsPlaylist(text: string, base: string): string {
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

/** Master playlists and VOD (ENDLIST) are static enough to cache; live is not. */
export function isCacheablePlaylist(text: string): boolean {
  return /#EXT-X-STREAM-INF/i.test(text) || /#EXT-X-ENDLIST/i.test(text);
}
