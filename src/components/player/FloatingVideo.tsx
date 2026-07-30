"use client";

import { type RefObject, useRef, useState } from "react";
import { usePlayer } from "@/lib/store";
import { formatTime, cn } from "@/lib/utils";
import {
  Play,
  Pause,
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Loader2,
  Maximize,
  SkipForward,
  AlertTriangle,
  Heart,
  PictureInPicture2,
  Gauge,
  RotateCcw,
} from "lucide-react";

/**
 * Persistent video surface. Renders in a YouTube-style corner mini-player by default
 * and expands to a full theater overlay. The <video> element itself is owned by
 * PlayerHost (passed via ref) so it never unmounts — playback continues across pages.
 */
export default function FloatingVideo({
  videoRef,
  visible,
  onRetry,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  visible: boolean;
  onRetry: () => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const s = usePlayer();
  const c = s.current;
  const live = c?.isLive || !isFinite(s.duration) || s.duration === 0;
  const pct = s.duration > 0 && isFinite(s.duration) ? (s.progress / s.duration) * 100 : 0;

  const favorited = !!c && s.favorites.some((f) => f.id === c.id);
  const hasNext = s.queue.length > 1;
  const skipUnavailable = () => (hasNext ? s.next() : s.stop());

  // HLS quality levels
  const [showQuality, setShowQuality] = useState(false);
  const levelsSorted = [...s.qualities].sort((a, b) => b.height - a.height || b.bitrate - a.bitrate);
  const qLabel = (q: { height: number; bitrate: number }) =>
    q.height ? `${q.height}p` : `${Math.round(q.bitrate / 1000)}k`;
  const activeQ = s.currentQuality >= 0 ? s.qualities[s.currentQuality] : undefined;
  const qBadge =
    s.pinnedQuality === -1
      ? activeQ?.height
        ? `${activeQ.height}p`
        : "Auto"
      : qLabel(s.qualities[s.pinnedQuality] ?? { height: 0, bitrate: 0 });

  const goFullscreen = () => {
    const el = frameRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const togglePip = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (document.pictureInPictureEnabled) await v.requestPictureInPicture();
    } catch {
      /* PiP unsupported or blocked */
    }
  };

  return (
    <div
      className={cn(
        "z-[60]",
        !visible && "hidden",
        s.expanded
          ? "fixed inset-0 grid place-items-center bg-black/95 p-2 backdrop-blur-md sm:p-6"
          : "fixed bottom-4 right-4 w-[min(92vw,440px)]",
      )}
    >
      <div
        ref={frameRef}
        className={cn(
          "group relative aspect-video w-full overflow-hidden bg-black",
          s.expanded
            ? "max-w-6xl rounded-2xl shadow-2xl ring-1 ring-white/10"
            : "rounded-xl shadow-2xl ring-1 ring-white/15",
        )}
      >
        <video
          ref={videoRef}
          playsInline
          onClick={s.toggle}
          className="absolute inset-0 h-full w-full bg-black object-contain"
        />

        {/* Loading / error overlays */}
        {s.loading && !s.error && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-black/30">
            <Loader2 className="h-10 w-10 animate-spin text-white/90" />
          </div>
        )}
        {s.error && (
          <div
            className="absolute inset-0 z-20 grid place-items-center bg-black/85 p-4 text-center"
            role="alert"
            aria-live="assertive"
          >
            <div className="max-w-sm">
              <AlertTriangle className="mx-auto h-8 w-8 text-amber-400" />
              <p className="mt-2 text-sm font-medium text-white">Playback unavailable</p>
              <p className="mt-1 text-xs leading-relaxed text-white/70">{s.error}</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex h-11 min-w-24 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-black transition hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  aria-label={`Retry ${c?.title || "video"}`}
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry
                </button>
                <button
                  type="button"
                  onClick={skipUnavailable}
                  className="inline-flex h-11 min-w-24 items-center justify-center gap-1.5 rounded-full bg-white/10 px-4 text-xs font-semibold text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  aria-label={hasNext ? "Skip to next item" : "Skip unavailable item and close player"}
                >
                  <SkipForward className="h-4 w-4" />
                  {hasNext ? "Next" : "Skip"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        {!s.error && (
        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/60 via-transparent to-black/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100 [&:has(:focus-visible)]:opacity-100">
          {/* Top */}
          <div className="flex items-start justify-between gap-2 p-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white drop-shadow">{c?.title}</p>
              <p className="truncate text-xs text-white/70">{c?.subtitle}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => s.setExpanded(!s.expanded)}
                className="grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60"
                aria-label={s.expanded ? "Minimize" : "Expand"}
              >
                {s.expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={s.stop}
                className="grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white hover:bg-red-500/70"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Center play */}
          <button
            onClick={s.toggle}
            aria-label={s.isPlaying ? "Pause" : "Play"}
            className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 p-3 text-white backdrop-blur transition hover:scale-110 hover:bg-black/60"
          >
            {s.isPlaying ? (
              <Pause className="h-6 w-6" fill="currentColor" />
            ) : (
              <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
            )}
          </button>

          {/* Bottom */}
          <div className="flex items-center gap-2 p-2.5">
            <button onClick={s.toggle} className="text-white" aria-label="Play/pause">
              {s.isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}
            </button>

            {live ? (
              <div className="flex flex-1 items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-red-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Live
              </div>
            ) : (
              <>
                <span className="text-[11px] tabular-nums text-white/80">{formatTime(s.progress)}</span>
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
                <span className="text-[11px] tabular-nums text-white/80">{formatTime(s.duration)}</span>
              </>
            )}

            <button onClick={s.toggleMute} className="text-white" aria-label="Mute">
              {s.muted || s.volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              onClick={() => c && s.toggleFavorite(c)}
              className={cn("transition", favorited ? "text-accent" : "text-white hover:text-accent")}
              aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
            >
              <Heart className="h-4 w-4" fill={favorited ? "currentColor" : "none"} />
            </button>
            <button onClick={togglePip} className="hidden text-white sm:block" aria-label="Picture in picture">
              <PictureInPicture2 className="h-4 w-4" />
            </button>
            {s.qualities.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowQuality((v) => !v)}
                  className="flex items-center gap-1 text-white"
                  aria-label="Quality"
                >
                  <Gauge className="h-4 w-4" />
                  <span className="text-[10px] font-semibold tabular-nums">{qBadge}</span>
                </button>
                {showQuality && (
                  <div className="absolute bottom-8 right-0 z-10 max-h-48 w-28 overflow-y-auto rounded-lg border border-white/15 bg-black/90 py-1 backdrop-blur">
                    <button
                      onClick={() => {
                        s.setQuality(-1);
                        setShowQuality(false);
                      }}
                      className={cn(
                        "block w-full px-3 py-1.5 text-left text-xs",
                        s.pinnedQuality === -1 ? "text-accent" : "text-white hover:bg-white/10",
                      )}
                    >
                      Auto
                    </button>
                    {levelsSorted.map((q) => (
                      <button
                        key={q.index}
                        onClick={() => {
                          s.setQuality(q.index);
                          setShowQuality(false);
                        }}
                        className={cn(
                          "block w-full px-3 py-1.5 text-left text-xs",
                          s.pinnedQuality === q.index ? "text-accent" : "text-white hover:bg-white/10",
                        )}
                      >
                        {qLabel(q)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button onClick={goFullscreen} className="text-white" aria-label="Fullscreen">
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
