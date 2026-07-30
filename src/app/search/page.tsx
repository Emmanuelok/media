"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Globe2, Radio, Search as SearchIcon, Sparkles, Waves } from "lucide-react";
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
  const router = useRouter();
  const q = (sp.get("q") || "").trim();
  const ql = q.toLowerCase();
  const openConcierge = useUI((s) => s.openConcierge);
  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = String(form.get("q") || "").trim();
    if (next) router.push(`/search?q=${encodeURIComponent(next)}`);
  };

  if (!q) {
    return (
      <div className="animate-fade-up route-discovery">
        <PageHeader
          icon={SearchIcon}
          title="Search"
          subtitle="Find anything across video, music, live TV & radio"
          image="/aurora/ai-concierge.webp"
          eyebrow="Intelligent discovery"
        />
        <section className="discovery-command" aria-labelledby="discovery-command-title">
          <span>
            <Sparkles className="h-3.5 w-3.5" />
            Discovery canvas
          </span>
          <h2 id="discovery-command-title">What kind of world do you want to enter?</h2>
          <p>
            Search by title, station, country, genre—or describe an atmosphere and let Aurora build
            the path.
          </p>
          <form onSubmit={submitSearch}>
            <SearchIcon className="h-5 w-5" />
            <input
              name="q"
              aria-label="Search Aurora"
              placeholder="Try “live radio from Accra” or “quiet science films”…"
            />
            <button type="submit" aria-label="Search">
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <div className="discovery-starters">
            <Link href="/tv?cat=news">
              <Globe2 className="h-4 w-4" />
              Global live news
            </Link>
            <Link href="/radio?q=jazz">
              <Radio className="h-4 w-4" />
              Jazz around the world
            </Link>
            <button onClick={() => openConcierge("Build me a calm cross-media discovery journey")}>
              <Waves className="h-4 w-4" />
              Calm discovery journey
            </button>
          </div>
        </section>
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
    <div className="animate-fade-up space-y-8 route-discovery">
      <PageHeader
        icon={SearchIcon}
        title={`Results for “${q}”`}
        subtitle="Across every medium on Aurora"
        image="/aurora/ai-concierge.webp"
        eyebrow="Intelligent discovery"
      />

      <section className="discovery-query-strip">
        <form onSubmit={submitSearch}>
          <SearchIcon className="h-5 w-5" />
          <input name="q" defaultValue={q} aria-label="Refine search" />
          <button type="submit">Refine</button>
        </form>
        <button onClick={() => openConcierge(q)}>
          <Sparkles className="h-4 w-4" />
          Ask Aurora to turn “{q}” into a journey
        </button>
      </section>

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
    <Suspense fallback={<div className="min-h-[60vh] animate-pulse rounded-xl bg-white/[0.03]" />}>
      <SearchInner />
    </Suspense>
  );
}
