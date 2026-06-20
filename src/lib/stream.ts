// Route a stream URL through our server-side proxy (adds CORS, upgrades HTTP→HTTPS,
// rewrites HLS playlists). See src/app/api/stream/route.ts.
export function proxiedUrl(url: string): string {
  return `/api/stream?url=${encodeURIComponent(url)}`;
}

/** HTTP origins must be proxied to play on an HTTPS page (mixed-content). */
export function needsProxy(url: string): boolean {
  return url.startsWith("http://");
}

/** Probe a stream's reachability via /api/check (server-side; no CORS limits). */
export async function checkStream(url: string, timeoutMs = 9000): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`/api/check?url=${encodeURIComponent(url)}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.ok;
  } catch {
    return false;
  }
}

/** Run async work over items with bounded concurrency. */
export async function pool<T>(items: T[], concurrency: number, fn: (x: T) => Promise<void>): Promise<void> {
  let i = 0;
  const n = Math.min(concurrency, items.length);
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const idx = i++;
        await fn(items[idx]);
      }
    }),
  );
}
