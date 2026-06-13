"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Music2, Play, Pause } from "lucide-react";
import { TRACKS, PLAYLISTS, tracksFor } from "@/lib/catalog";
import { usePlayer } from "@/lib/store";
import { Artwork } from "@/components/ui/Artwork";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatTime, cn, gradientFor } from "@/lib/utils";

function MusicInner() {
  const sp = useSearchParams();
  const q = (sp.get("q") || "").toLowerCase();
  const play = usePlayer((s) => s.play);
  const toggle = usePlayer((s) => s.toggle);
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);

  const tracks = TRACKS.filter(
    (t) => !q || `${t.title} ${t.subtitle} ${t.category}`.toLowerCase().includes(q),
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        icon={Music2}
        title="Music"
        subtitle="Albums, playlists & tracks — with a player that follows you everywhere"
        accent="bg-gradient-to-br from-emerald-500 to-green-600"
      />

      {!q && (
        <>
          <h2 className="mb-3 text-lg font-bold text-white">Made for you</h2>
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {PLAYLISTS.map((pl) => {
              const list = tracksFor(pl.trackIds);
              return (
                <button
                  key={pl.id}
                  onClick={() => list[0] && play(list[0], list)}
                  className="group flex items-center gap-3 overflow-hidden rounded-xl bg-surface-2 p-3 text-left transition hover:bg-surface"
                >
                  <span
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-lg text-2xl"
                    style={{ background: gradientFor(pl.title) }}
                  >
                    {pl.emoji}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-white">{pl.title}</span>
                    <span className="block truncate text-xs text-muted">{pl.subtitle}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <h2 className="mb-2 text-lg font-bold text-white">
        {q ? `Songs matching “${q}”` : "All Songs"}
      </h2>
      <div className="overflow-hidden rounded-xl border border-white/5">
        {tracks.map((t, i) => {
          const active = current?.id === t.id;
          return (
            <button
              key={t.id}
              onClick={() => (active ? toggle() : play(t, tracks))}
              className={cn(
                "group flex w-full items-center gap-3 px-3 py-2 text-left transition",
                active ? "bg-white/10" : "hover:bg-white/5",
              )}
            >
              <span className="grid w-6 place-items-center">
                {active && isPlaying ? (
                  <Pause className="h-3.5 w-3.5 fill-accent text-accent" />
                ) : (
                  <>
                    <span
                      className={cn(
                        "text-sm tabular-nums text-muted group-hover:hidden",
                        active && "text-accent",
                      )}
                    >
                      {i + 1}
                    </span>
                    <Play className="hidden h-3.5 w-3.5 fill-white text-white group-hover:block" />
                  </>
                )}
              </span>
              <Artwork
                src={t.thumbnail}
                title={t.title}
                kind="music"
                rounded="rounded-md"
                className="h-10 w-10"
              />
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-sm font-medium", active ? "text-accent" : "text-white")}>
                  {t.title}
                </span>
                <span className="block truncate text-xs text-muted">{t.subtitle}</span>
              </span>
              <span className="hidden text-xs text-muted sm:block">{t.category}</span>
              <span className="w-12 text-right text-xs tabular-nums text-muted">
                {formatTime(t.duration)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MusicInner />
    </Suspense>
  );
}
