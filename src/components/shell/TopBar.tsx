"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { useUI } from "@/lib/ui";

export default function TopBar() {
  const router = useRouter();
  const openConcierge = useUI((s) => s.openConcierge);
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 bg-[#08080c]/80 px-4 py-3 backdrop-blur-xl sm:px-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
        className="relative flex-1 sm:max-w-xl"
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search videos, music, channels & stations…"
          className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-muted focus:border-accent/60 focus:bg-white/10 focus:outline-none"
        />
      </form>

      <button
        onClick={() => openConcierge(q.trim() || undefined)}
        className="flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-600/20 transition hover:opacity-90"
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">Ask Aurora</span>
      </button>

      <div className="hidden h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-bold text-white sm:grid">
        A
      </div>
    </header>
  );
}
