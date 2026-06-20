import { kvGetJson, kvSetJson, kvConfigured } from "@/lib/kv";
import { pushConfigured, type PushSubscription, type PushRecord } from "@/lib/webpush";
import type { Schedule } from "@/lib/routines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INDEX = "aurora:push:index";
const KEY = (id: string) => `aurora:push:${id}`;
const validId = (id: string) => /^[a-zA-Z0-9_-]{8,64}$/.test(id);

export async function POST(req: Request) {
  if (!pushConfigured()) return Response.json({ error: "push not configured" }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "bad body" }, { status: 400 });
  }

  const deviceId = String(body.deviceId ?? "");
  if (!validId(deviceId)) return Response.json({ error: "invalid deviceId" }, { status: 400 });

  const sub = body.subscription as PushSubscription | undefined;
  if (!sub || typeof sub !== "object" || typeof (sub as { endpoint?: unknown }).endpoint !== "string") {
    return Response.json({ error: "invalid subscription" }, { status: 400 });
  }

  const schedules = (Array.isArray(body.schedules) ? body.schedules : []).slice(0, 50) as Schedule[];
  const tzOffset = typeof body.tzOffset === "number" ? body.tzOffset : 0;

  const record: PushRecord = { subscription: sub, schedules, tzOffset, updatedAt: Date.now() };
  await kvSetJson(KEY(deviceId), record, 60 * 60 * 24 * 120);

  const idx = (await kvGetJson<string[]>(INDEX)) || [];
  if (!idx.includes(deviceId)) {
    idx.push(deviceId);
    await kvSetJson(INDEX, idx.slice(-10000));
  }
  return Response.json({ ok: true, durable: kvConfigured() });
}
