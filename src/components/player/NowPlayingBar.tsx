"use client";

import { usePlayer } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { Artwork } from "@/components/ui/Artwork";
import { formatTime, cn } from "@/lib/utils";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
  Heart,
  Loader2,
  ListMusic,
  Shuffle,
  Repeat,
  Repeat1,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

export default function NowPlayingBar({ onRetry }: { onRetry: () => void }) {
  const s = usePlayer();
  const toggleQueue = useUI((u) => u.toggleQueue);
  const queueOpen = useUI((u) => u.queueOpen);
  const c = s.current;
  if (!c) return null;

  const live = c.isLive || !isFinite(s.duration) || (s.duration === 0 && c.kind === "radio");
  const pct = s.duration > 0 && isFinite(s.duration) ? (s.progress / s.duration) * 100 : 0;
  const VolumeIcon = s.muted || s.volume === 0 ? VolumeX : s.volume < 0.5 ? Volume1 : Volume2;
  const favorited = s.favorites.some((f) => f.id === c.id);
  const RepeatIcon = s.repeat === "one" ? Repeat1 : Repeat;
  const hasNext = s.queue.length > 1;
  const skipUnavailable = () => (hasNext ? s.next() : s.stop());

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0b0b12]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 items-center gap-3 px-3 sm:px-4">
        {/* Track meta */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Artwork
            src={c.thumbnail}
            title={c.title}
            kind={c.kind}
            className="h-14 w-14 shrink-0"
            rounded="rounded-lg"
            contain={c.kind === "radio"}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-white">{c.title}</p>
              {live && (
                <span className="flex items-center gap-1 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-400">
                  <span className="eq" aria-hidden>
                    <i /> <i /> <i />
                  </span>
                  Live
                </span>
              )}
            </div>
            <p className={cn("truncate text-xs", s.error ? "text-amber-300" : "text-muted")}>
              {s.error ? "Playback unavailable" : c.subtitle}
            </p>
          </div>
          <button
            onClick={() => s.toggleFavorite(c)}
            className={cn(
              "ml-1 hidden shrink-0 rounded-full p-2 transition sm:block",
              favorited ? "text-accent" : "text-muted hover:text-accent",
            )}
            aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
          >
            <Heart className="h-4 w-4" fill={favorited ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Transport + progress */}
        <div className="flex max-w-2xl flex-[1.4] flex-col items-center gap-1.5">
          {s.error ? (
            <div
              className="flex w-full items-center justify-center gap-2"
              role="alert"
              aria-live="assertive"
            >
              <AlertTriangle className="hidden h-5 w-5 shrink-0 text-amber-400 sm:block" />
              <p className="hidden min-w-0 flex-1 truncate text-xs text-amber-100 lg:block">
                {s.error}
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex h-11 min-w-20 items-center justify-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold text-black transition hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label={`Retry ${c.title}`}
              >
                <RotateCcw className="h-4 w-4" />
                Retry
              </button>
              <button
                type="button"
                onClick={skipUnavailable}
                className="inline-flex h-11 min-w-20 items-center justify-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label={hasNext ? "Skip to next item" : "Skip unavailable item and close player"}
              >
                <SkipForward className="h-4 w-4" />
                {hasNext ? "Next" : "Skip"}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={s.toggleShuffle}
                  aria-label="Shuffle"
                  className={cn(
                    "hidden transition sm:block",
                    s.shuffle ? "text-accent" : "text-muted hover:text-white",
                  )}
                >
                  <Shuffle className="h-4 w-4" />
                </button>
                <button onClick={s.prev} className="text-muted transition hover:text-white" aria-label="Previous">
                  <SkipBack className="h-5 w-5" fill="currentColor" />
                </button>
                <button
                  onClick={s.toggle}
                  className="grid h-11 w-11 place-items-center rounded-full bg-white text-black shadow-lg transition hover:scale-105 active:scale-95"
                  aria-label={s.isPlaying ? "Pause" : "Play"}
                >
                  {s.loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : s.isPlaying ? (
                    <Pause className="h-5 w-5" fill="currentColor" />
                  ) : (
                    <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                  )}
                </button>
                <button onClick={s.next} className="text-muted transition hover:text-white" aria-label="Next">
                  <SkipForward className="h-5 w-5" fill="currentColor" />
                </button>
                <button
                  onClick={s.cycleRepeat}
                  aria-label={`Repeat: ${s.repeat}`}
                  title={`Repeat: ${s.repeat}`}
                  className={cn(
                    "hidden transition sm:block",
                    s.repeat !== "off" ? "text-accent" : "text-muted hover:text-white",
                  )}
                >
                  <RepeatIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="flex w-full items-center gap-2">
                <span className="w-10 text-right text-[11px] tabular-nums text-muted">
                  {live ? "" : formatTime(s.progress)}
                </span>
                {live ? (
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-full animate-pulse bg-gradient-to-r from-red-500/40 via-red-400 to-red-500/40" />
                  </div>
                ) : (
                  <input
                    type="range"
                    className="seek flex-1"
                    min={0}
                    max={s.duration || 0}
                    step={0.1}
                    value={s.progress}
                    style={{
                      background: `linear-gradient(to right, #fff 0 ${pct}%, rgba(255,255,255,0.18) ${pct}% 100%)`,
                    }}
                    onChange={(e) => s.seek(Number(e.target.value))}
                    aria-label="Seek"
                  />
                )}
                <span className="w-10 text-[11px] tabular-nums text-muted">
                  {live ? "LIVE" : formatTime(s.duration)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Volume + queue */}
        <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 md:flex">
          <button
            onClick={toggleQueue}
            className={cn(
              "rounded-full p-2 transition",
              queueOpen ? "text-accent" : "text-muted hover:text-white",
            )}
            aria-label="Queue"
          >
            <ListMusic className="h-4 w-4" />
          </button>
          <button onClick={s.toggleMute} className="text-muted transition hover:text-white" aria-label="Mute">
            <VolumeIcon className="h-5 w-5" />
          </button>
          <input
            type="range"
            className="seek w-24"
            min={0}
            max={1}
            step={0.01}
            value={s.muted ? 0 : s.volume}
            style={{
              background: `linear-gradient(to right, #fff 0 ${(s.muted ? 0 : s.volume) * 100}%, rgba(255,255,255,0.18) ${(s.muted ? 0 : s.volume) * 100}% 100%)`,
            }}
            onChange={(e) => s.setVolume(Number(e.target.value))}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
