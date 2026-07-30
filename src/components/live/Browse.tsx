"use client";

import { useEffect, useState } from "react";
import { MediaGrid } from "@/components/media/Media";
import { ChannelGrid } from "@/components/live/ChannelGrid";
import { SkeletonGrid, ErrorState, EmptyState } from "@/components/ui/States";
import type { MediaItem } from "@/lib/types";

function dependencyKey(deps: React.DependencyList): string {
  try {
    return JSON.stringify(deps);
  } catch {
    return deps.map((value) => String(value)).join("|");
  }
}

/**
 * Fetches a list of media via `loader` and renders the right state
 * (skeleton / error / empty / grid). The keyed request session remounts when
 * dependencies change, avoiding synchronous state resets inside an effect.
 */
function BrowseRequest({
  loader,
  square = false,
  empty,
  channelMode = false,
}: {
  loader: () => Promise<MediaItem[]>;
  square?: boolean;
  empty?: string;
  channelMode?: boolean;
}) {
  const [request] = useState(() => ({ loader }));
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    request.loader()
      .then((res) => alive && setItems(res))
      .catch((e) => alive && setError(e?.message || "Failed to load"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [request]);

  if (loading) return <SkeletonGrid square={square} />;
  if (error) return <ErrorState message={error} />;
  if (!items.length) return <EmptyState message={empty} />;
  const liveDirectory =
    channelMode || items.every((item) => item.kind === "tv" || item.kind === "radio");
  return liveDirectory ? (
    <ChannelGrid items={items} square={square} />
  ) : (
    <MediaGrid items={items} />
  );
}

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
  return (
    <BrowseRequest
      key={dependencyKey(deps)}
      loader={loader}
      square={square}
      empty={empty}
      channelMode={channelMode}
    />
  );
}
