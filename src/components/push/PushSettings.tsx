"use client";

import { useEffect, useState } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { getVapidPublicKey, enableBackgroundPush } from "@/lib/push";
import { useSettings } from "@/lib/settings";
import { useRoutines } from "@/lib/routines-store";

export default function PushSettings() {
  const pushDeviceId = useSettings((s) => s.pushDeviceId);
  const setPushDeviceId = useSettings((s) => s.setPushDeviceId);
  const schedules = useRoutines((s) => s.schedules);
  const [vapid, setVapid] = useState<string | null | undefined>(undefined); // undefined = loading
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getVapidPublicKey().then(setVapid);
  }, []);

  const enable = async () => {
    if (!vapid) return;
    setBusy(true);
    setMsg("");
    let id = pushDeviceId;
    if (!id) {
      id = `dev-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`.slice(0, 40);
      setPushDeviceId(id);
    }
    const res = await enableBackgroundPush(vapid, id, schedules);
    setMsg(
      res.ok
        ? "✓ Background reminders enabled — scheduled routines will notify you even when Aurora is closed."
        : res.error || "Failed.",
    );
    setBusy(false);
  };

  if (vapid === undefined) {
    return <p className="text-xs text-muted">Checking…</p>;
  }
  if (vapid === null) {
    return (
      <p className="text-xs text-muted">
        Background push isn&apos;t configured on the server — it needs VAPID keys + a cron trigger at
        deploy time (see README). Until then, desktop reminders still work while Aurora is open.
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={enable}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
        {pushDeviceId ? "Update background reminders" : "Enable background reminders"}
      </button>
      {msg && <p className="mt-2 text-xs text-muted">{msg}</p>}
    </div>
  );
}
