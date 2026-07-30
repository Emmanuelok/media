"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Heart } from "lucide-react";
import { usePlayer } from "@/lib/store";
import { Artwork } from "@/components/ui/Artwork";
import { cn, formatTime } from "@/lib/utils";
import type { MediaItem } from "@/lib/types";

export function MediaCard({
  item,
  queue,
  className,
}: {
  item: MediaItem;
  queue?: MediaItem[];
  className?: string;
}) {
  const play = usePlayer((s) => s.play);
  const toggleFavorite = usePlayer((s) => s.toggleFavorite);
  const current = usePlayer((s) => s.current);
  const favorited = usePlayer((s) => s.favorites.some((f) => f.id === item.id));
  const isActive = current?.id === item.id;
  const wide = item.kind === "video" || item.kind === "tv";
  const contain = item.kind === "tv" || item.kind === "radio";

  return (
    <div className={cn("media-card group block w-full text-left", className)}>
      <div
        className={cn(
          "media-card-art relative w-full overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-white/7",
          wide ? "aspect-video" : "aspect-square",
          isActive && "ring-2 ring-accent",
        )}
      >
        <Artwork
          src={item.thumbnail}
          title={item.title}
          kind={item.kind}
          contain={contain}
          rounded="rounded-2xl"
          className="transition duration-700 group-hover:scale-[1.045]"
        />

        {/* Full-area play target (kept separate from the like button — no nested buttons) */}
        <button onClick={() => play(item, queue)} className="absolute inset-0 z-10" aria-label={`Play ${item.title}`} />

        {item.isLive && (
          <span className="pointer-events-none absolute left-2 top-2 z-20 flex items-center gap-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            Live
          </span>
        )}
        {item.badge && item.badge !== "LIVE" && (
          <span
            className={cn(
              "pointer-events-none absolute right-2 top-2 z-20 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide backdrop-blur",
              item.badge === "4K"
                ? "bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-white"
                : "bg-black/65 text-white",
            )}
          >
            {item.badge}
          </span>
        )}
        {item.duration && !item.isLive && (
          <span className="pointer-events-none absolute bottom-2 right-2 z-20 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white">
            {formatTime(item.duration)}
          </span>
        )}

        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-gradient-to-t from-black/70 via-black/5 to-white/5 opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="grid h-12 w-12 translate-y-2 place-items-center rounded-full border border-white/50 bg-white text-black shadow-2xl transition duration-300 group-hover:translate-y-0">
            <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
          </span>
        </div>

        <button
          onClick={() => toggleFavorite(item)}
          className={cn(
            "absolute bottom-2 left-2 z-30 grid h-11 w-11 place-items-center rounded-full bg-black/55 backdrop-blur transition focus-visible:opacity-100",
            favorited ? "text-accent opacity-100" : "text-white/90 opacity-100",
          )}
          aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
        >
          <Heart className="h-4 w-4" fill={favorited ? "currentColor" : "none"} />
        </button>
      </div>

      <button onClick={() => play(item, queue)} className="mt-3 block w-full px-0.5 text-left">
        <p
          className={cn(
            "line-clamp-2 text-sm font-semibold leading-snug tracking-[-0.01em]",
            isActive ? "text-accent" : "text-white",
          )}
        >
          {item.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {item.subtitle}
          {item.metric ? ` · ${item.metric}` : ""}
        </p>
      </button>
    </div>
  );
}

export function Shelf({
  title,
  subtitle,
  items,
  cardWidth = "w-44 sm:w-52",
}: {
  title: string;
  subtitle?: string;
  items: MediaItem[];
  cardWidth?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  if (!items.length) return null;
  const scroll = (dir: number) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });

  return (
    <section className="mb-10">
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.025em] text-white sm:text-xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-muted">{subtitle}</p>}
        </div>
        <div className="hidden gap-1 sm:flex">
          <button
            onClick={() => scroll(-1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-muted transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-muted transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>
      <div ref={ref} className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-2">
        {items.map((it) => (
          <div key={it.id} className={cn("shrink-0 snap-start", cardWidth)}>
            <MediaCard item={it} queue={items} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function MediaGrid({ items, className }: { items: MediaItem[]; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
        className,
      )}
    >
      {items.map((it) => (
        <MediaCard key={it.id} item={it} queue={items} />
      ))}
    </div>
  );
}
