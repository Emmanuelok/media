"use client";

import { useState } from "react";
import { Tv, Radio, Music2, Play } from "lucide-react";
import { cn, gradientFor } from "@/lib/utils";
import type { MediaKind } from "@/lib/types";

const ICONS = { tv: Tv, radio: Radio, music: Music2, video: Play } as const;

/** Image with a graceful gradient + icon fallback for missing/broken art. */
export function Artwork({
  src,
  title,
  kind = "video",
  className,
  rounded = "rounded-xl",
  contain = false,
}: {
  src?: string;
  title: string;
  kind?: MediaKind;
  className?: string;
  rounded?: string;
  contain?: boolean;
}) {
  const [err, setErr] = useState(false);
  const Icon = ICONS[kind];

  if (!src || err) {
    return (
      <div
        className={cn("relative grid place-items-center overflow-hidden", rounded, className)}
        style={{ background: gradientFor(title) }}
      >
        <Icon className="h-2/5 w-2/5 max-h-10 max-w-10 text-white/85" />
        <div className="absolute inset-0 bg-black/10" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={title}
      loading="lazy"
      onError={() => setErr(true)}
      className={cn(
        "h-full w-full bg-surface-2",
        contain ? "object-contain p-1" : "object-cover",
        rounded,
        className,
      )}
    />
  );
}
