"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { VIDEOS } from "@/lib/catalog";
import { MediaGrid } from "@/components/media/Media";
import { PageHeader } from "@/components/ui/PageHeader";
import { Chips } from "@/components/ui/Chips";
import { EmptyState } from "@/components/ui/States";

function VideoInner() {
  const sp = useSearchParams();
  const q = (sp.get("q") || "").toLowerCase();
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(VIDEOS.map((v) => v.category).filter(Boolean)))] as string[],
    [],
  );
  const [cat, setCat] = useState("All");

  const items = VIDEOS.filter((v) => {
    if (cat !== "All" && v.category !== cat) return false;
    if (q && !`${v.title} ${v.subtitle} ${v.category}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="animate-fade-up">
      <PageHeader
        icon={Clapperboard}
        title="Video"
        subtitle="On-demand films, shows & shorts — in up to 4K"
        accent="bg-gradient-to-br from-rose-500 to-red-600"
      />
      {q && (
        <p className="mb-4 text-sm text-muted">
          Filtering by “<span className="text-white">{q}</span>”
        </p>
      )}
      <Chips
        className="mb-6"
        items={categories.map((c) => ({ id: c, label: c }))}
        value={cat}
        onChange={setCat}
      />
      {items.length ? <MediaGrid items={items} /> : <EmptyState message="No videos match this filter." />}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VideoInner />
    </Suspense>
  );
}
