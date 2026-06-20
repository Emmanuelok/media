"use client";

import type { Schedule } from "./routines";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const r = await fetch("/api/push/vapid");
    const d = await r.json();
    return typeof d.publicKey === "string" && d.publicKey ? d.publicKey : null;
  } catch {
    return null;
  }
}

/** Subscribe this browser to push and register the device's schedules with the server. */
export async function enableBackgroundPush(
  publicKey: string,
  deviceId: string,
  schedules: Schedule[],
): Promise<{ ok: boolean; error?: string }> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, error: "Push isn't supported in this browser." };
  }
  if (typeof Notification !== "undefined") {
    if (Notification.permission === "denied") return { ok: false, error: "Notifications are blocked." };
    if (Notification.permission === "default") {
      const p = await Notification.requestPermission();
      if (p !== "granted") return { ok: false, error: "Notifications permission denied." };
    }
  }
  try {
    await navigator.serviceWorker.register("/sw.js").catch(() => {});
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      }));
    const res = await fetch("/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        subscription: sub.toJSON(),
        schedules,
        tzOffset: new Date().getTimezoneOffset(),
      }),
    });
    const d = await res.json();
    if (!res.ok) return { ok: false, error: d.error || "Failed to register." };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "Subscription failed." };
  }
}
