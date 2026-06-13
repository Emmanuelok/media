"use client";

import { useEffect, useState } from "react";
import { Shelf } from "@/components/media/Media";
import type { MediaItem } from "@/lib/types";

/** A home-page carousel backed by an async loader; hides itself if loading fails. */
export function LiveShelf({
  title,
  subtitle,
  loader,
  cardWidth,
}: {
  title: string;
  subtitle?: string;
  loader: () => Promise<MediaItem[]>;
  cardWidth?: string;
}) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    loader()
      .then((res) => alive && setItems(res))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) return null;

  if (!items) {
    return (
      <section className="mb-8">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        <div className="no-scrollbar flex gap-3 overflow-hidden pb-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={cardWidth ?? "w-44 sm:w-52"}>
              <div className="aspect-square animate-pulse rounded-xl bg-surface-2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return <Shelf title={title} subtitle={subtitle} items={items} cardWidth={cardWidth} />;
}
