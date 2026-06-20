import { VAPID_PUBLIC_KEY, pushConfigured } from "@/lib/webpush";

export const runtime = "nodejs";

// Returns the VAPID public key for the browser to subscribe with (null if push
// isn't configured — the UI hides the feature in that case).
export function GET() {
  return Response.json({ publicKey: pushConfigured() ? VAPID_PUBLIC_KEY : null });
}
