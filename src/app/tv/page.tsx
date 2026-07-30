"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Globe2, Info, Play, ShieldCheck, Tv } from "lucide-react";
import {
  FEATURED_TV,
  TV_CATEGORIES,
  TV_COUNTRIES,
  tvByCategory,
  tvByCountry,
} from "@/lib/tv";
import { Browse } from "@/components/live/Browse";
import { ChannelGrid } from "@/components/live/ChannelGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { Chips } from "@/components/ui/Chips";
import { Artwork } from "@/components/ui/Artwork";
import { usePlayer } from "@/lib/store";

function TvInner() {
  const sp = useSearchParams();
  const q = (sp.get("q") || "").toLowerCase();
  const country = (sp.get("country") || "").toLowerCase();
  const matchedCat = TV_CATEGORIES.find((c) => c.id === q);
  const [sel, setSel] = useState(
    country ? `country:${country}` : matchedCat ? `cat:${matchedCat.id}` : "featured",
  );
  const play = usePlayer((state) => state.play);
  const lead = FEATURED_TV[0];

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
    <div className="animate-fade-up route-live-deck">
      <PageHeader
        icon={Tv}
        title="Live TV"
        subtitle="Thousands of free-to-air channels worldwide — news, sports, movies & more"
        accent="bg-gradient-to-br from-sky-500 to-blue-600"
        image="/aurora/live-tv-world.webp"
        eyebrow="Global signal"
      />

      {lead && (
        <section className="live-deck-stage" aria-labelledby="live-deck-title">
          <div className="live-deck-screen">
            <Artwork
              src={lead.thumbnail}
              title={lead.title}
              subtitle={lead.country}
              kind="tv"
              showMeta
              rounded="rounded-none"
              className="h-full w-full"
            />
            <span className="live-deck-corners" aria-hidden="true" />
          </div>
          <div className="live-deck-copy">
            <span className="live-deck-kicker">
              <span />
              Live deck / first signal
            </span>
            <h2 id="live-deck-title">{lead.title}</h2>
            <p>
              {lead.description ||
                "A public live transmission with automatic reachability checks and an official destination when embedded playback is unavailable."}
            </p>
            <dl>
              <div>
                <dt>Source</dt>
                <dd>{lead.sourceLabel || "Public feed"}</dd>
              </div>
              <div>
                <dt>Language</dt>
                <dd>{lead.language || "Not listed"}</dd>
              </div>
              <div>
                <dt>Region</dt>
                <dd>{lead.country || "Worldwide"}</dd>
              </div>
            </dl>
            <div className="live-deck-actions">
              <button onClick={() => play(lead, FEATURED_TV)} className="signal-action-primary">
                <Play className="h-4 w-4" fill="currentColor" />
                Watch live
              </button>
              {lead.officialUrl && (
                <a
                  href={lead.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="signal-action-secondary"
                >
                  Official page
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
          <div className="live-deck-status" aria-label="Live source safeguards">
            <span>
              <ShieldCheck className="h-4 w-4" />
              Signal checked before trust
            </span>
            <span>
              <Globe2 className="h-4 w-4" />
              Regional limits respected
            </span>
          </div>
        </section>
      )}

      <div className="live-filter-dock">
        <span className="live-filter-label">Explore by signal</span>
        <Chips items={catChips} value={sel} onChange={setSel} />
        <Chips items={countryChips} value={sel} onChange={setSel} />
      </div>

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-white/10 bg-surface/40 p-3 text-xs text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
        <p>
          Aurora indexes public stream links and does not host broadcasts. Availability can change
          by region and time. If a source is unavailable, use its official broadcaster page; Aurora
          never bypasses subscriptions, geographic restrictions, DRM or licensing.
        </p>
      </div>

      {sel === "featured" ? (
        <ChannelGrid items={FEATURED_TV} />
      ) : sel.startsWith("cat:") ? (
        <Browse
          channelMode
          deps={[sel]}
          loader={() => tvByCategory(sel.slice(4))}
          empty="No channels found in this category."
        />
      ) : (
        <Browse
          channelMode
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
    <Suspense fallback={<div className="min-h-[60vh] animate-pulse rounded-xl bg-white/[0.03]" />}>
      <TvInner />
    </Suspense>
  );
}
