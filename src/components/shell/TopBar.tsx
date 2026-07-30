"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Sparkles, Settings } from "lucide-react";
import { useUI } from "@/lib/ui";

export default function TopBar() {
  const router = useRouter();
  const openConcierge = useUI((s) => s.openConcierge);
  const [q, setQ] = useState("");

  return (
    <header className="topbar-lux sticky top-0 z-30 mx-3 mt-3 flex items-center gap-3 rounded-2xl border border-white/10 px-3 py-2.5 backdrop-blur-2xl sm:mx-5 sm:px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
        className="relative flex-1 sm:max-w-2xl"
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search videos, music, channels & stations…"
          className="topbar-search w-full rounded-xl border border-white/8 bg-black/20 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/35 focus:border-white/20 focus:bg-white/8 focus:outline-none"
        />
      </form>

      <button
        onClick={() => openConcierge(q.trim() || undefined)}
        className="topbar-ai flex shrink-0 items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">Ask Aurora</span>
      </button>

      <Link
        href="/settings"
        className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl border border-transparent text-muted transition hover:border-white/10 hover:bg-white/5 hover:text-white sm:grid"
        aria-label="Settings"
      >
        <Settings className="h-5 w-5" />
      </Link>

      <div className="avatar-orbit hidden h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white sm:grid">
        A
      </div>
    </header>
  );
}
