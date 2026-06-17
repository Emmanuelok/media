"use client";

import { useEffect } from "react";
import { useRoutines } from "@/lib/routines-store";
import { isScheduleDue, todayKey } from "@/lib/routines";
import { useUI } from "@/lib/ui";
import { useSettings } from "@/lib/settings";

/**
 * Fires scheduled routines at their local time while Aurora is open. Web apps
 * can't reliably run in the background, so this only triggers when a tab is open.
 */
export default function RoutineScheduler() {
  const openConcierge = useUI((s) => s.openConcierge);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const { schedules, markFired } = useRoutines.getState();
      const due = schedules.find((s) => isScheduleDue(s, now));
      if (due) {
        markFired(due.id, todayKey(now));
        openConcierge(due.prompt, true);
        if (
          useSettings.getState().notifyRoutines &&
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          try {
            new Notification("Aurora", {
              body: `Starting your routine: ${due.label}`,
              icon: "/icon.svg",
              tag: "aurora-routine",
            });
          } catch {
            /* notification may be blocked */
          }
        }
      }
    };
    tick();
    const iv = setInterval(tick, 30000);
    return () => clearInterval(iv);
  }, [openConcierge]);

  return null;
}
