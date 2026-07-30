"use client";

import Image from "next/image";
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
        className={cn(
          "fallback-art relative grid place-items-center overflow-hidden",
          rounded,
          className,
        )}
        style={{ background: gradientFor(title) }}
      >
        <span className="fallback-art-orbit" aria-hidden="true" />
        <span className="fallback-art-grid" aria-hidden="true" />
        <Icon className="relative z-10 h-2/5 w-2/5 max-h-10 max-w-10 text-white/90 drop-shadow-lg" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/10" />
      </div>
    );
  }

  if (src.startsWith("/")) {
    return (
      <div className={cn("relative overflow-hidden bg-surface-2", rounded, className)}>
        <Image
          src={src}
          alt={title}
          fill
          sizes="(max-width: 768px) 50vw, 20vw"
          onError={() => setErr(true)}
          className={cn(contain ? "object-contain p-1" : "object-cover", rounded)}
        />
      </div>
    );
  }

  return (
    // Live station and broadcaster art comes from thousands of dynamic third-party hosts.
    // A native image keeps those sources functional without an unsafe wildcard optimizer policy.
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
