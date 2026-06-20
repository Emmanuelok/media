import webpush from "web-push";
import type { Schedule } from "./routines";

// Server-side web-push config. Requires VAPID keys in env:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:...)
// Generate with: npx web-push generate-vapid-keys

export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@aurora.app";

export function pushConfigured(): boolean {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

let configured = false;
function ensure() {
  if (!configured && pushConfigured()) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    configured = true;
  }
}

export async function sendPush(
  subscription: webpush.PushSubscription,
  payload: object,
): Promise<{ ok: boolean; gone: boolean }> {
  ensure();
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { ok: true, gone: false };
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    return { ok: false, gone: status === 404 || status === 410 };
  }
}

export type { PushSubscription } from "web-push";

export interface PushRecord {
  subscription: webpush.PushSubscription;
  schedules: Schedule[];
  tzOffset: number;
  updatedAt: number;
}
