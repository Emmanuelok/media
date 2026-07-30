"use client";

import Image from "next/image";
import { useState } from "react";
import { Tv, Radio, Music2, Play } from "lucide-react";
import { cn, gradientFor } from "@/lib/utils";
import {
  channelBackplate,
  channelInitials,
  channelTint,
} from "@/lib/channel-art";
import type { MediaKind } from "@/lib/types";

const ICONS = { tv: Tv, radio: Radio, music: Music2, video: Play } as const;

function StationMark({
  src,
  title,
}: {
  src?: string;
  title: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className="text-center text-xl font-semibold tracking-[-0.06em] text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)] sm:text-2xl">
        {channelInitials(title)}
      </span>
    );
  }

  return src.startsWith("/") ? (
    <Image
      src={src}
      alt=""
      fill
      sizes="(max-width: 768px) 32vw, 11vw"
      onError={() => setFailed(true)}
      className="object-contain p-3 drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)]"
    />
  ) : (
    // Broadcaster marks come from a large, changing set of third-party hosts.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-contain p-3 drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)]"
    />
  );
}

function LiveArtwork({
  src,
  title,
  kind,
  subtitle,
  className,
  rounded,
  showMeta,
}: {
  src?: string;
  title: string;
  kind: MediaKind;
  subtitle?: string;
  className?: string;
  rounded: string;
  showMeta: boolean;
}) {
  const backplate = channelBackplate(title, kind);

  return (
    <div
      className={cn(
        "relative h-full w-full isolate overflow-hidden bg-[#070911]",
        rounded,
        className,
      )}
      role="img"
      aria-label={`${title}${subtitle ? `, ${subtitle}` : ""} artwork`}
    >
      <Image
        src={backplate}
        alt=""
        fill
        sizes="(max-width: 768px) 50vw, 20vw"
        className="object-cover scale-[1.04] saturate-[1.12]"
      />
      <span
        className={cn(
          "absolute inset-0 bg-gradient-to-br mix-blend-screen",
          channelTint(title),
        )}
        aria-hidden="true"
      />
      <span
        className="absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgba(255,255,255,0.28),transparent_18%),linear-gradient(to_top,rgba(1,3,9,0.96),rgba(1,3,9,0.08)_58%,rgba(1,3,9,0.22))]"
        aria-hidden="true"
      />
      <span
        className="absolute -right-[18%] -top-[30%] h-[85%] w-[85%] rounded-full border border-white/15 shadow-[inset_0_0_55px_rgba(255,255,255,0.08),0_0_65px_rgba(83,210,255,0.12)]"
        aria-hidden="true"
      />
      <span
        className="absolute left-[9%] top-[15%] h-px w-[82%] origin-left -rotate-[18deg] bg-gradient-to-r from-transparent via-white/65 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.55)]"
        aria-hidden="true"
      />

      <span className="absolute left-1/2 top-[43%] grid h-[34%] min-h-14 w-[42%] min-w-16 -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-[1.1rem] border border-white/20 bg-black/35 shadow-[0_15px_45px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl">
        <StationMark key={src || "initials"} src={src} title={title} />
      </span>

      {showMeta && (
        <span className="absolute inset-x-4 bottom-3.5 z-10 block min-w-0 pr-12 text-left">
          <span className="block truncate text-sm font-semibold tracking-[-0.025em] text-white drop-shadow-lg">
            {title}
          </span>
          <span className="mt-0.5 block truncate text-[10px] font-medium uppercase tracking-[0.14em] text-white/55">
            {subtitle || (kind === "radio" ? "Global radio" : "Global television")}
          </span>
        </span>
      )}
    </div>
  );
}

/** Image with a graceful gradient + icon fallback for missing/broken art. */
export function Artwork({
  src,
  title,
  kind = "video",
  className,
  rounded = "rounded-xl",
  contain = false,
  subtitle,
  showMeta = false,
}: {
  src?: string;
  title: string;
  kind?: MediaKind;
  className?: string;
  rounded?: string;
  contain?: boolean;
  subtitle?: string;
  showMeta?: boolean;
}) {
  const [err, setErr] = useState(false);
  const Icon = ICONS[kind];

  if (kind === "tv" || kind === "radio") {
    return (
      <LiveArtwork
        src={src}
        title={title}
        kind={kind}
        subtitle={subtitle}
        className={className}
        rounded={rounded}
        showMeta={showMeta}
      />
    );
  }

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
