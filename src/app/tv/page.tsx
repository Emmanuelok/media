"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tv, Info } from "lucide-react";
import {
  FEATURED_TV,
  TV_CATEGORIES,
  TV_COUNTRIES,
  tvByCategory,
  tvByCountry,
} from "@/lib/tv";
import { MediaGrid } from "@/components/media/Media";
import { Browse } from "@/components/live/Browse";
import { PageHeader } from "@/components/ui/PageHeader";
import { Chips } from "@/components/ui/Chips";

function TvInner() {
  const sp = useSearchParams();
  const q = (sp.get("q") || "").toLowerCase();
  const matchedCat = TV_CATEGORIES.find((c) => c.id === q);
  const [sel, setSel] = useState(matchedCat ? `cat:${matchedCat.id}` : "featured");

  const catChips = [
    { id: "featured", label: "Featured", emoji: "⭐" },
    ...TV_CATEGORIES.map((c) => ({ id: `cat:${c.id}`, label: c.name, emoji: c.emoji })),
  ];
  const countryChips = TV_COUNTRIES.map((c) => ({
    id: `country:${c.code}`,
    label: c.name,
    emoji: c.flag,
  }));

  return (
    <div className="animate-fade-up">
      <PageHeader
        icon={Tv}
        title="Live TV"
        subtitle="Thousands of free-to-air channels worldwide — news, sports, movies & more"
        accent="bg-gradient-to-br from-sky-500 to-blue-600"
      />

      <Chips className="mb-3" items={catChips} value={sel} onChange={setSel} />
      <Chips className="mb-5" items={countryChips} value={sel} onChange={setSel} />

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-white/10 bg-surface/40 p-3 text-xs text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
        <p>
          Channels are public free-to-air streams from the open iptv-org directory. Aurora routes
          HTTP-only or CORS-blocked streams through a built-in proxy to maximise playback, but
          availability still varies by region and over time — some may be geo-blocked. Premium / 4K
          sports broadcasts (e.g. the World Cup) require separate licensing.
        </p>
      </div>

      {sel === "featured" ? (
        <MediaGrid items={FEATURED_TV} />
      ) : sel.startsWith("cat:") ? (
        <Browse
          deps={[sel]}
          loader={() => tvByCategory(sel.slice(4))}
          empty="No channels found in this category."
        />
      ) : (
        <Browse
          deps={[sel]}
          loader={() => tvByCountry(sel.slice(8))}
          empty="No channels found for this country."
        />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TvInner />
    </Suspense>
  );
}
