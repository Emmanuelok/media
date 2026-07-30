"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Clapperboard, Play, ScanLine } from "lucide-react";
import { VIDEOS } from "@/lib/catalog";
import { MediaGrid } from "@/components/media/Media";
import { Artwork } from "@/components/ui/Artwork";
import { PageHeader } from "@/components/ui/PageHeader";
import { Chips } from "@/components/ui/Chips";
import { EmptyState } from "@/components/ui/States";
import { usePlayer } from "@/lib/store";

function VideoInner() {
  const sp = useSearchParams();
  const q = (sp.get("q") || "").toLowerCase();
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(VIDEOS.map((v) => v.category).filter(Boolean)))] as string[],
    [],
  );
  const [cat, setCat] = useState("All");
  const play = usePlayer((state) => state.play);

  const items = VIDEOS.filter((v) => {
    if (cat !== "All" && v.category !== cat) return false;
    if (q && !`${v.title} ${v.subtitle} ${v.category}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const feature = items[0];

  return (
    <div className="animate-fade-up route-screening">
      <PageHeader
        icon={Clapperboard}
        title="Video"
        subtitle="On-demand films, shows & shorts — in up to 4K"
        accent="bg-gradient-to-br from-rose-500 to-red-600"
        image="/aurora/video-world.webp"
        eyebrow="Aurora cinema"
      />
      {!q && feature && (
        <section className="screening-stage" aria-labelledby="screening-stage-title">
          <div className="screening-stage-media">
            <Artwork
              src={feature.thumbnail}
              title={feature.title}
              kind="video"
              rounded="rounded-none"
              className="h-full w-full"
            />
            <div className="screening-stage-grade" />
          </div>
          <div className="screening-stage-copy">
            <span>
              <ScanLine className="h-3.5 w-3.5" />
              Tonight&apos;s feature
            </span>
            <h2 id="screening-stage-title">{feature.title}</h2>
            <p>{feature.description || feature.subtitle}</p>
            <div>
              <button onClick={() => play(feature, items)} className="signal-action-primary">
                <Play className="h-4 w-4" fill="currentColor" />
                Start screening
              </button>
              <button
                onClick={() => document.getElementById("screening-archive")?.scrollIntoView({ behavior: "smooth" })}
                className="signal-action-secondary"
              >
                Browse archive
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="screening-stage-meta">
            <span>FORMAT</span>
            <strong>{feature.badge || "HD"}</strong>
            <span>PROGRAM</span>
            <strong>{feature.category || "Aurora Select"}</strong>
          </div>
        </section>
      )}
      {q && (
        <p className="mb-4 text-sm text-muted">
          Filtering by “<span className="text-white">{q}</span>”
        </p>
      )}
      <section id="screening-archive" className="route-archive">
        <div className="route-archive-heading">
          <div>
            <span>THE PROGRAM</span>
            <h2>Screening archive</h2>
          </div>
          <Chips
            items={categories.map((c) => ({ id: c, label: c }))}
            value={cat}
            onChange={setCat}
          />
        </div>
        {items.length ? (
          <MediaGrid items={items} />
        ) : (
          <EmptyState message="No videos match this filter." />
        )}
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] animate-pulse rounded-xl bg-white/[0.03]" />}>
      <VideoInner />
    </Suspense>
  );
}
