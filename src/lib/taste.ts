import type { MediaItem } from "./types";

// Lightweight cross-session "memory": derive a compact taste profile from what the
// user has liked and played (already persisted), plus an optional stated note. The
// profile is sent to the AI so plans get personalized. Pure + testable.

function tally(values: (string | undefined)[]): string[] {
  const m = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    m.set(v, (m.get(v) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
}

export function buildTasteProfile(
  favorites: MediaItem[],
  recents: MediaItem[],
  note?: string,
): string {
  const parts: string[] = [];
  if (note && note.trim()) parts.push(`Stated preferences: ${note.trim().slice(0, 300)}`);

  const all = [...favorites, ...recents];
  const categories = tally(all.map((i) => i.category));
  const kinds = tally(all.map((i) => i.kind));
  const liked = favorites.slice(0, 5).map((i) => i.title);

  if (categories.length) parts.push(`Favorite genres/categories: ${categories.slice(0, 5).join(", ")}`);
  if (kinds.length) parts.push(`Most-used media types: ${kinds.slice(0, 3).join(", ")}`);
  if (liked.length) parts.push(`Recently liked: ${liked.join(", ")}`);

  return parts.join(". ").slice(0, 600);
}
