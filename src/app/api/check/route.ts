import { assertReachable } from "@/lib/proxy";

// Lightweight server-side reachability probe for a stream URL. Used by the Live TV
// "verify" feature to surface channels that are actually up (free IPTV rotates a lot).
// SSRF-guarded the same way as the proxy; never streams a body back.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = (process.env.AURORA_PROXY_ALLOWED_HOSTS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

async function probe(
  url: URL,
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number; kind?: "hls" | "media"; redirects: number }> {
  let current = url;
  for (let redirects = 0; redirects <= 2; redirects += 1) {
    await assertReachable(current.hostname, ALLOWED_HOSTS);
    const res = await fetch(current.toString(), {
      method: "GET",
      redirect: "manual",
      signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (AuroraMediaHouse)",
        Range: "bytes=0-2047",
        Accept: "application/vnd.apple.mpegurl, application/x-mpegURL, audio/*, video/*, */*",
      },
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      await res.body?.cancel();
      if (!location || redirects === 2) {
        return { ok: false, status: res.status, redirects };
      }
      const next = new URL(location, current);
      if (next.protocol !== "http:" && next.protocol !== "https:") {
        return { ok: false, status: res.status, redirects };
      }
      current = next;
      continue;
    }

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    if (!res.ok || contentType.includes("text/html")) {
      await res.body?.cancel();
      return { ok: false, status: res.status, redirects };
    }

    const looksHls =
      current.pathname.toLowerCase().includes(".m3u8") ||
      contentType.includes("mpegurl") ||
      contentType.includes("vnd.apple");
    if (looksHls) {
      const reader = res.body?.getReader();
      const first = await reader?.read();
      await reader?.cancel();
      const text = first?.value ? new TextDecoder().decode(first.value) : "";
      return {
        ok: text.trimStart().startsWith("#EXTM3U"),
        status: res.status,
        kind: "hls",
        redirects,
      };
    }

    await res.body?.cancel();
    return { ok: true, status: res.status, kind: "media", redirects };
  }

  return { ok: false, status: 0, redirects: 2 };
}

export async function GET(req: Request) {
  const target = new URL(req.url).searchParams.get("url");
  if (!target) return Response.json({ ok: false, error: "missing url" }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return Response.json({ ok: false, error: "invalid url" }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return Response.json({ ok: false, error: "unsupported scheme" }, { status: 400 });
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    return Response.json(await probe(parsed, ctrl.signal));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const blocked =
      message === "blocked host" ||
      message === "host not allowed" ||
      message === "unresolved host";
    return Response.json({ ok: false, status: 0, blocked });
  } finally {
    clearTimeout(timer);
  }
}
