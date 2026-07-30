"use client";

import { Heart, Play, Radio, Signal, SignalHigh, SignalLow } from "lucide-react";
import { Artwork } from "@/components/ui/Artwork";
import { usePlayer } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { SignalHealth } from "@/lib/channel-art";
import type { MediaItem } from "@/lib/types";

const HEALTH_LABEL: Record<SignalHealth, string> = {
  unknown: "Signal untested",
  checking: "Testing signal",
  online: "Top-level signal reachable",
  offline: "Signal unavailable",
};

function HealthIcon({ status }: { status: SignalHealth }) {
  if (status === "online") return <SignalHigh className="h-3.5 w-3.5" />;
  if (status === "offline") return <SignalLow className="h-3.5 w-3.5" />;
  if (status === "checking") return <Signal className="h-3.5 w-3.5 animate-pulse" />;
  return <Signal className="h-3.5 w-3.5" />;
}

export function SignalBadge({ status }: { status: SignalHealth }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] shadow-lg backdrop-blur-xl",
        status === "online" && "border-emerald-300/25 bg-emerald-950/65 text-emerald-200",
        status === "offline" && "border-rose-300/20 bg-rose-950/65 text-rose-200",
        status === "checking" && "border-cyan-300/25 bg-cyan-950/65 text-cyan-100",
        status === "unknown" && "border-white/15 bg-black/55 text-white/65",
      )}
      aria-label={HEALTH_LABEL[status]}
    >
      <HealthIcon status={status} />
      {status === "online"
        ? "Reachable"
        : status === "offline"
          ? "Unavailable"
          : status === "checking"
            ? "Testing"
            : "Untested"}
    </span>
  );
}

export function ChannelTile({
  item,
  queue,
  status = "unknown",
  square = false,
}: {
  item: MediaItem;
  queue?: MediaItem[];
  status?: SignalHealth;
  square?: boolean;
}) {
  const play = usePlayer((state) => state.play);
  const toggleFavorite = usePlayer((state) => state.toggleFavorite);
  const current = usePlayer((state) => state.current);
  const favorited = usePlayer((state) => state.favorites.some((favorite) => favorite.id === item.id));
  const active = current?.id === item.id;
  const location = item.country || item.subtitle || "Worldwide";

  return (
    <article className="group min-w-0">
      <div
        className={cn(
          "relative isolate overflow-hidden rounded-[1.4rem] border bg-[#090b12] shadow-[0_22px_60px_rgba(0,0,0,0.28)] transition duration-500",
          square ? "aspect-square" : "aspect-[16/10]",
          active
            ? "border-cyan-300/70 shadow-[0_0_0_1px_rgba(103,232,249,0.3),0_28px_70px_rgba(8,145,178,0.2)]"
            : "border-white/10 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_30px_80px_rgba(0,0,0,0.42)]",
        )}
      >
        <Artwork
          src={item.thumbnail}
          title={item.title}
          kind={item.kind}
          subtitle={location}
          contain
          showMeta
          rounded="rounded-[1.4rem]"
          className="transition duration-700 ease-out group-hover:scale-[1.035]"
        />

        <button
          type="button"
          onClick={() => play(item, queue)}
          className="absolute inset-0 z-20 min-h-11 min-w-11 rounded-[1.4rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          aria-label={`Play ${item.title} live`}
        />

        <div className="pointer-events-none absolute inset-x-3 top-3 z-30 flex items-start justify-between gap-2">
          <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-xl">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.9)]" />
            Live
          </span>
          <SignalBadge status={status} />
        </div>

        <div className="pointer-events-none absolute bottom-3 right-3 z-30 grid h-12 w-12 translate-y-2 place-items-center rounded-full border border-white/60 bg-white text-black opacity-0 shadow-2xl transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          {item.kind === "radio" ? (
            <Radio className="h-5 w-5" />
          ) : (
            <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
          )}
        </div>

        <button
          type="button"
          onClick={() => toggleFavorite(item)}
          className={cn(
            "absolute bottom-2.5 left-2.5 z-40 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/60 text-white shadow-lg backdrop-blur-xl transition hover:scale-105 hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
            favorited && "border-fuchsia-300/40 bg-fuchsia-950/75 text-fuchsia-200",
          )}
          aria-label={favorited ? `Remove ${item.title} from favorites` : `Save ${item.title} to favorites`}
          aria-pressed={favorited}
        >
          <Heart className="h-4 w-4" fill={favorited ? "currentColor" : "none"} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => play(item, queue)}
        className="mt-3 block min-h-11 w-full rounded-xl px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        aria-label={`Play ${item.title}`}
      >
        <span className={cn("line-clamp-1 text-sm font-semibold tracking-[-0.02em]", active ? "text-cyan-200" : "text-white")}>
          {item.title}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-xs text-white/50">
          <span className="truncate">{location}</span>
          {item.category && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{item.category}</span>
            </>
          )}
        </span>
      </button>
    </article>
  );
}
