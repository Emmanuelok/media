"use client";

import { useEffect, useState } from "react";
import { MediaGrid } from "@/components/media/Media";
import { ChannelGrid } from "@/components/live/ChannelGrid";
import { SkeletonGrid, ErrorState, EmptyState } from "@/components/ui/States";
import type { MediaItem } from "@/lib/types";

/**
 * Fetches a list of media via `loader` and renders the right state
 * (skeleton / error / empty / grid). Refetches whenever `deps` change.
 */
export function Browse({
  loader,
  deps,
  square = false,
  empty,
  channelMode = false,
}: {
  loader: () => Promise<MediaItem[]>;
  deps: React.DependencyList;
  square?: boolean;
  empty?: string;
  channelMode?: boolean;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    loader()
      .then((res) => alive && setItems(res))
      .catch((e) => alive && setError(e?.message || "Failed to load"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  if (loading) return <SkeletonGrid square={square} />;
  if (error) return <ErrorState message={error} />;
  if (!items.length) return <EmptyState message={empty} />;
  return channelMode ? <ChannelGrid items={items} /> : <MediaGrid items={items} />;
}
