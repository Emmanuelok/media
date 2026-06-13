// Route a stream URL through our server-side proxy (adds CORS, upgrades HTTP→HTTPS,
// rewrites HLS playlists). See src/app/api/stream/route.ts.
export function proxiedUrl(url: string): string {
  return `/api/stream?url=${encodeURIComponent(url)}`;
}

/** HTTP origins must be proxied to play on an HTTPS page (mixed-content). */
export function needsProxy(url: string): boolean {
  return url.startsWith("http://");
}
