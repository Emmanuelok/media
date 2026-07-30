import type { MediaItem, MediaKind } from "@/lib/types";

export type SignalHealth = "unknown" | "checking" | "online" | "offline";

const TV_BACKPLATES = [
  "/aurora/live-tv-world.webp",
  "/aurora/global-world.webp",
  "/aurora/video-world.webp",
  "/aurora/hero-cinema.webp",
] as const;

const RADIO_BACKPLATES = [
  "/aurora/radio-world.webp",
  "/aurora/music-world.webp",
  "/aurora/album-chromatic.webp",
  "/aurora/album-after-hours.webp",
  "/aurora/album-lighthouse.webp",
] as const;

const SIGNAL_TINTS = [
  "from-cyan-300/25 via-blue-600/5 to-fuchsia-500/25",
  "from-violet-300/25 via-indigo-600/5 to-orange-400/25",
  "from-emerald-300/20 via-cyan-700/5 to-blue-500/25",
  "from-amber-200/20 via-orange-600/5 to-rose-500/25",
  "from-fuchsia-300/20 via-purple-700/5 to-cyan-400/25",
] as const;

export function hashSignal(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function channelBackplate(title: string, kind: MediaKind): string {
  const set = kind === "radio" || kind === "music" ? RADIO_BACKPLATES : TV_BACKPLATES;
  return set[hashSignal(`${kind}:${title}`) % set.length];
}

export function channelTint(title: string): string {
  return SIGNAL_TINTS[hashSignal(title) % SIGNAL_TINTS.length];
}

export function channelInitials(title: string): string {
  const meaningful = title
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!meaningful.length) return "LIVE";
  if (meaningful.length === 1) return meaningful[0].slice(0, 3).toUpperCase();
  return meaningful
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function channelCollectionKey(items: MediaItem[]): string {
  const fingerprint = items.map((item) => `${item.id}:${item.src}`).join("|");
  return `${items.length}-${hashSignal(fingerprint).toString(36)}`;
}

