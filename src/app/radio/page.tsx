"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Globe2, Headphones, Play, Radio, Search, Waves } from "lucide-react";
import {
  topRadio,
  radioByTag,
  radioByCountry,
  searchRadio,
  RADIO_GENRES,
  RADIO_COUNTRIES,
} from "@/lib/radio";
import { Browse } from "@/components/live/Browse";
import { PageHeader } from "@/components/ui/PageHeader";
import { Chips } from "@/components/ui/Chips";
import { Artwork } from "@/components/ui/Artwork";
import { usePlayer } from "@/lib/store";
import type { MediaItem } from "@/lib/types";

function TunerSpotlight() {
  const [station, setStation] = useState<MediaItem | null>(null);
  const play = usePlayer((state) => state.play);

  useEffect(() => {
    let active = true;
    void topRadio(1)
      .then((items) => {
        if (active) setStation(items[0] ?? null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="tuner-stage" aria-labelledby="tuner-stage-title">
      <div className="tuner-stage-art">
        <Artwork
          src={station?.thumbnail}
          title={station?.title || "Aurora World Tuner"}
          subtitle={station?.country || "Global radio"}
          kind="radio"
          showMeta
          rounded="rounded-none"
          className="h-full w-full"
        />
      </div>
      <div className="tuner-stage-copy">
        <span>
          <Waves className="h-3.5 w-3.5" />
          Frequency in focus
        </span>
        <h2 id="tuner-stage-title">{station?.title || "Scanning the world…"}</h2>
        <p>
          {station
            ? [station.country, station.language, station.codec, station.bitrate ? `${station.bitrate} kbps` : null]
                .filter(Boolean)
                .join(" / ")
            : "Finding a recently verified, browser-compatible station."}
        </p>
        {station && (
          <button onClick={() => play(station, [station])} className="signal-action-primary">
            <Play className="h-4 w-4" fill="currentColor" />
            Tune in
          </button>
        )}
      </div>
      <div className="tuner-dial" aria-hidden="true">
        <span>88</span>
        <i />
        <span>92</span>
        <i />
        <span>96</span>
        <i />
        <span>100</span>
        <i />
        <span>104</span>
        <i />
        <span>108</span>
      </div>
      <div className="tuner-meta">
        <span>
          <Headphones className="h-4 w-4" />
          Browser-safe codecs
        </span>
        <span>
          <Globe2 className="h-4 w-4" />
          Recent health data
        </span>
      </div>
    </section>
  );
}

function RadioSession({ initialQ }: { initialQ: string }) {
  const [q, setQ] = useState(initialQ);
  const [input, setInput] = useState(initialQ);
  const [sel, setSel] = useState("top");

  const genreChips = [
    { id: "top", label: "Top", emoji: "🔥" },
    ...RADIO_GENRES.map((g) => ({ id: `genre:${g.id}`, label: g.name, emoji: g.emoji })),
  ];
  const countryChips = RADIO_COUNTRIES.map((c) => ({
    id: `country:${c.code}`,
    label: c.name,
    emoji: c.flag,
  }));

  const loader = () =>
    q
      ? searchRadio(q)
      : sel.startsWith("country:")
        ? radioByCountry(sel.slice(8), 60)
        : sel.startsWith("genre:")
          ? radioByTag(sel.slice(6), 48)
          : topRadio(60);

  return (
    <div className="animate-fade-up route-world-tuner">
      <PageHeader
        icon={Radio}
        title="Live Radio"
        subtitle="35,000+ live stations from every corner of the planet"
        accent="bg-gradient-to-br from-amber-500 to-orange-600"
        image="/aurora/radio-world.webp"
        eyebrow="The world in sound"
      />

      <TunerSpotlight />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQ(input.trim());
        }}
        className="tuner-search relative mb-4 max-w-xl"
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search stations (e.g. BBC, Smooth Jazz, Tokyo)…"
          className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-muted focus:border-accent/60 focus:outline-none"
        />
      </form>

      {!q && (
        <div className="live-filter-dock">
          <span className="live-filter-label">Scan by sound or place</span>
          <Chips
            items={genreChips}
            value={sel}
            onChange={(v) => {
              setSel(v);
              setQ("");
            }}
          />
          <Chips
            items={countryChips}
            value={sel}
            onChange={(v) => {
              setSel(v);
              setQ("");
            }}
          />
        </div>
      )}
      {q && (
        <p className="mb-4 text-sm text-muted">
          Results for “<span className="text-white">{q}</span>” ·{" "}
          <button
            onClick={() => {
              setQ("");
              setInput("");
            }}
            className="text-accent hover:underline"
          >
            clear
          </button>
        </p>
      )}

      <Browse
        deps={[q, sel]}
        loader={loader}
        square
        empty="No stations found — try another search, genre or country."
      />
    </div>
  );
}

function RadioInner() {
  const sp = useSearchParams();
  const initialQ = sp.get("q") || "";
  return <RadioSession key={initialQ} initialQ={initialQ} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] animate-pulse rounded-xl bg-white/[0.03]" />}>
      <RadioInner />
    </Suspense>
  );
}
