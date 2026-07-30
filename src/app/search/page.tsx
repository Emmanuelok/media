"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon, Sparkles } from "lucide-react";
import { LOCAL_INDEX } from "@/lib/catalog";
import { FEATURED_TV } from "@/lib/tv";
import { searchRadio } from "@/lib/radio";
import { MediaGrid } from "@/components/media/Media";
import { Browse } from "@/components/live/Browse";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { useUI } from "@/lib/ui";

function SearchInner() {
  const sp = useSearchParams();
  const q = (sp.get("q") || "").trim();
  const ql = q.toLowerCase();
  const openConcierge = useUI((s) => s.openConcierge);

  if (!q) {
    return (
      <div className="animate-fade-up">
        <PageHeader
          icon={SearchIcon}
          title="Search"
          subtitle="Find anything across video, music, live TV & radio"
          image="/aurora/ai-concierge.webp"
          eyebrow="Intelligent discovery"
        />
        <EmptyState message="Type in the search bar above to explore Aurora." />
      </div>
    );
  }

  const onDemand = LOCAL_INDEX.filter((i) =>
    `${i.title} ${i.subtitle} ${i.category}`.toLowerCase().includes(ql),
  );
  const tvMatches = FEATURED_TV.filter((i) =>
    `${i.title} ${i.subtitle} ${i.category}`.toLowerCase().includes(ql),
  );

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        icon={SearchIcon}
        title={`Results for “${q}”`}
        subtitle="Across every medium on Aurora"
        image="/aurora/ai-concierge.webp"
        eyebrow="Intelligent discovery"
      />

      <button
        onClick={() => openConcierge(q)}
        className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 p-4 text-left transition hover:from-violet-600/30 hover:to-fuchsia-600/30"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
          <Sparkles className="h-5 w-5 text-white" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-white">Ask Aurora AI about “{q}”</span>
          <span className="block text-xs text-muted">
            Get curated, conversational recommendations across everything
          </span>
        </span>
      </button>

      <section>
        <h2 className="mb-3 text-lg font-bold text-white">Video & Music</h2>
        {onDemand.length ? (
          <MediaGrid items={onDemand} />
        ) : (
          <EmptyState message="No on-demand matches — but check live stations below." />
        )}
      </section>

      {tvMatches.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">Live TV</h2>
          <MediaGrid items={tvMatches} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold text-white">Live Radio</h2>
        <Browse deps={[q]} loader={() => searchRadio(q)} square empty="No live stations matched that search." />
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SearchInner />
    </Suspense>
  );
}
