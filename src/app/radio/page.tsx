"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Radio, Search } from "lucide-react";
import { topRadio, radioByTag, searchRadio, RADIO_GENRES } from "@/lib/radio";
import { Browse } from "@/components/live/Browse";
import { PageHeader } from "@/components/ui/PageHeader";
import { Chips } from "@/components/ui/Chips";

function RadioInner() {
  const sp = useSearchParams();
  const initialQ = sp.get("q") || "";
  const [q, setQ] = useState(initialQ);
  const [input, setInput] = useState(initialQ);
  const [genre, setGenre] = useState("top");

  // Sync when navigated here with a query (e.g. from the AI concierge).
  useEffect(() => {
    setQ(initialQ);
    setInput(initialQ);
  }, [initialQ]);

  const genreChips = [
    { id: "top", label: "Top", emoji: "🔥" },
    ...RADIO_GENRES.map((g) => ({ id: g.id, label: g.name, emoji: g.emoji })),
  ];

  const loader = () =>
    q ? searchRadio(q) : genre === "top" ? topRadio(60) : radioByTag(genre, 48);

  return (
    <div className="animate-fade-up">
      <PageHeader
        icon={Radio}
        title="Live Radio"
        subtitle="35,000+ live stations from every corner of the planet"
        accent="bg-gradient-to-br from-amber-500 to-orange-600"
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
        <Chips
          className="mb-6"
          items={genreChips}
          value={genre}
          onChange={(g) => {
            setGenre(g);
            setQ("");
          }}
        />
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
        deps={[q, genre]}
        loader={loader}
        square
        empty="No stations found — try another search or genre."
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
