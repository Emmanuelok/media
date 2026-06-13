"use client";

import { useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";
import PlayerHost from "@/components/player/PlayerHost";
import Concierge from "@/components/ai/Concierge";
import { usePlayer } from "@/lib/store";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const current = usePlayer((s) => s.current);
  const accent = useSettings((s) => s.accent);
  const audioActive = current && current.kind !== "video" && current.kind !== "tv";

  // Apply the chosen accent color app-wide.
  useEffect(() => {
    document.documentElement.style.setProperty("--color-accent", accent);
  }, [accent]);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main
          className={cn(
            "flex-1 px-4 py-6 sm:px-6 lg:px-8",
            audioActive ? "pb-40 md:pb-28" : "pb-24 md:pb-10",
          )}
        >
          {children}
        </main>
      </div>
      <MobileNav />
      <PlayerHost />
      <Concierge />
    </div>
  );
}
