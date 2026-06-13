"use client";

import Link from "next/link";
import { Sparkles, Tv, Radio } from "lucide-react";
import { Shelf } from "@/components/media/Media";
import { LiveShelf } from "@/components/live/LiveShelf";
import { VIDEOS, TRACKS } from "@/lib/catalog";
import { FEATURED_TV } from "@/lib/tv";
import { topRadio } from "@/lib/radio";
import { useUI } from "@/lib/ui";

export default function Home() {
  const openConcierge = useUI((s) => s.openConcierge);

  return (
    <div className="animate-fade-up">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-700/40 via-fuchsia-700/15 to-cyan-700/20 px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90">
            <Sparkles className="h-3.5 w-3.5" /> AI Media House
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
            Everything you watch & hear.{" "}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
              One home.
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/75 sm:text-lg">
            On-demand video and music, plus live TV and radio from across the globe — discovered for
            you by Aurora&apos;s AI concierge.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => openConcierge()}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.03]"
            >
              <Sparkles className="h-4 w-4" /> Ask Aurora AI
            </button>
            <Link
              href="/tv"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Tv className="h-4 w-4" /> Live TV
            </Link>
            <Link
              href="/radio"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Radio className="h-4 w-4" /> Live Radio
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-10">
        <Shelf title="Trending Now" subtitle="What the world is watching" items={VIDEOS.slice(0, 8)} cardWidth="w-60 sm:w-72" />
        <Shelf
          title="Live TV · Featured Channels"
          subtitle="Free-to-air, around the world"
          items={FEATURED_TV}
          cardWidth="w-60 sm:w-72"
        />
        <Shelf
          title="Fresh on Aurora Sound"
          subtitle="New music for every mood"
          items={TRACKS}
          cardWidth="w-40 sm:w-44"
        />
        <LiveShelf
          title="Top Radio Right Now"
          subtitle="Live stations trending globally"
          loader={() => topRadio(24)}
          cardWidth="w-40 sm:w-44"
        />
        <Shelf
          title="Quick Watches"
          subtitle="Short and sweet"
          items={VIDEOS.filter((v) => v.category === "Shorts")}
          cardWidth="w-60 sm:w-72"
        />
      </div>
    </div>
  );
}
