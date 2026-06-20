import { kvGet, kvSet, kvConfigured } from "@/lib/kv";

// Code-based cross-device sync. Stores a JSON snapshot under a user-chosen code.
// Works with the in-memory KV in dev (single instance); set KV env for real
// durable cross-device sync.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = (code: string) => `aurora:sync:${code}`;
const validCode = (code: string) => /^[a-zA-Z0-9_-]{4,40}$/.test(code);

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code") || "";
  if (!validCode(code)) return Response.json({ error: "invalid code" }, { status: 400 });
  const s = await kvGet(KEY(code));
  if (!s) return Response.json({ found: false, durable: kvConfigured() });
  try {
    return Response.json({ found: true, durable: kvConfigured(), ...JSON.parse(s) });
  } catch {
    return Response.json({ found: false, durable: kvConfigured() });
  }
}

export async function POST(req: Request) {
  let body: { code?: unknown; data?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad body" }, { status: 400 });
  }
  const code = String(body.code ?? "");
  if (!validCode(code)) return Response.json({ error: "invalid code" }, { status: 400 });
  if (!body.data || typeof body.data !== "object") {
    return Response.json({ error: "no data" }, { status: 400 });
  }
  const payload = JSON.stringify({ data: body.data, updatedAt: Date.now() });
  if (payload.length > 1_000_000) return Response.json({ error: "too large" }, { status: 413 });
  await kvSet(KEY(code), payload, 60 * 60 * 24 * 90); // 90-day TTL
  return Response.json({ ok: true, durable: kvConfigured(), updatedAt: Date.now() });
}
