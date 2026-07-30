"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Radio, Search } from "lucide-react";
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

function RadioInner() {
  const sp = useSearchParams();
  const initialQ = sp.get("q") || "";
  const [q, setQ] = useState(initialQ);
  const [input, setInput] = useState(initialQ);
  const [sel, setSel] = useState("top");

  useEffect(() => {
    setQ(initialQ);
    setInput(initialQ);
  }, [initialQ]);

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
    <div className="animate-fade-up">
      <PageHeader
        icon={Radio}
        title="Live Radio"
        subtitle="35,000+ live stations from every corner of the planet"
        accent="bg-gradient-to-br from-amber-500 to-orange-600"
        image="/aurora/radio-world.webp"
        eyebrow="The world in sound"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQ(input.trim());
        }}
        className="relative mb-4 max-w-md"
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
        <>
          <Chips
            className="mb-3"
            items={genreChips}
            value={sel}
            onChange={(v) => {
              setSel(v);
              setQ("");
            }}
          />
          <Chips
            className="mb-6"
            items={countryChips}
            value={sel}
            onChange={(v) => {
              setSel(v);
              setQ("");
            }}
          />
        </>
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

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RadioInner />
    </Suspense>
  );
}
