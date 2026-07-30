"use client";

import { useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";
import PlayerHost from "@/components/player/PlayerHost";
import Concierge from "@/components/ai/Concierge";
import ServiceWorkerRegistrar from "@/components/pwa/ServiceWorkerRegistrar";
import RoutineScheduler from "@/components/routines/RoutineScheduler";
import { usePlayer } from "@/lib/store";
import { useSettings } from "@/lib/settings";
import { useUI } from "@/lib/ui";
import { cn } from "@/lib/utils";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const current = usePlayer((s) => s.current);
  const accent = useSettings((s) => s.accent);
  const openConcierge = useUI((s) => s.openConcierge);
  const audioActive = current && current.kind !== "video" && current.kind !== "tv";

  // Apply the chosen accent color app-wide.
  useEffect(() => {
    document.documentElement.style.setProperty("--color-accent", accent);
  }, [accent]);

  // Auto-run a routine when opened from a push notification (/?routine=...).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("routine");
    if (!r) return;
    openConcierge(r, true);
    params.delete("routine");
    const qs = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, [openConcierge]);

  return (
    <div className="app-shell relative flex min-h-screen w-full">
      <div className="app-ambient" aria-hidden="true">
        <span className="app-ambient-orb app-ambient-orb-one" />
        <span className="app-ambient-orb app-ambient-orb-two" />
        <span className="app-ambient-grid" />
      </div>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main
          id="main"
          tabIndex={-1}
          className={cn(
            "app-main mx-auto w-full max-w-[1680px] flex-1 px-4 py-5 outline-none sm:px-6 lg:px-8",
            audioActive ? "pb-40 md:pb-28" : "pb-24 md:pb-10",
          )}
        >
          {children}
        </main>
      </div>
      <MobileNav />
      <PlayerHost />
      <Concierge />
      <ServiceWorkerRegistrar />
      <RoutineScheduler />
    </div>
  );
}
