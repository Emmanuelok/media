import { kvGetJson, kvSetJson } from "@/lib/kv";
import { pushConfigured, sendPush, type PushRecord } from "@/lib/webpush";
import { isScheduleDueUTC, utcDateKey } from "@/lib/routines";

// Cron-triggered: sends background push notifications for due scheduled routines.
// Trigger every minute from Vercel Cron / a GitHub Action with the CRON_SECRET.
// Requires VAPID + a durable KV (so registrations persist across invocations).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INDEX = "aurora:push:index";
const KEY = (id: string) => `aurora:push:${id}`;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // never allow an open trigger
  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!pushConfigured()) return Response.json({ error: "push not configured" }, { status: 503 });

  const idx = (await kvGetJson<string[]>(INDEX)) || [];
  let checked = 0;
  let sent = 0;

  for (const id of idx) {
    const rec = await kvGetJson<PushRecord>(KEY(id));
    if (!rec) continue;
    checked++;
    // Device-local wall clock: shift UTC by the device's tz offset.
    const wall = new Date(Date.now() - (rec.tzOffset || 0) * 60000);
    let changed = false;
    for (const s of rec.schedules) {
      if (!isScheduleDueUTC(s, wall)) continue;
      const res = await sendPush(rec.subscription, {
        title: "Aurora",
        body: `Starting your routine: ${s.label}`,
        tag: "aurora-routine",
        url: `/?routine=${encodeURIComponent(s.prompt)}`,
      });
      if (res.ok) sent++;
      s.lastFired = utcDateKey(wall);
      changed = true;
    }
    if (changed) await kvSetJson(KEY(id), { ...rec, updatedAt: Date.now() }, 60 * 60 * 24 * 120);
  }

  return Response.json({ ok: true, checked, sent });
}
