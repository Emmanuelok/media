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

  try {
    await assertReachable(parsed.hostname, ALLOWED_HOSTS);
  } catch {
    return Response.json({ ok: false, status: 0, blocked: true });
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "manual", // don't follow (avoids SSRF via redirect); 3xx still = reachable
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (AuroraMediaHouse)",
        Range: "bytes=0-1",
        Accept: "*/*",
      },
    });
    try {
      await res.body?.cancel();
    } catch {
      /* noop */
    }
    return Response.json({ ok: res.status > 0 && res.status < 400, status: res.status });
  } catch {
    return Response.json({ ok: false, status: 0 });
  } finally {
    clearTimeout(timer);
  }
}
