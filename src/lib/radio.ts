// Live Radio — real data from the Radio Browser project (https://www.radio-browser.info).
// A free, community-run directory of 35,000+ live stations worldwide. CORS-enabled, so
// these calls run directly from the user's browser. Plain audio stream URLs play through
// the <audio> element without CORS restrictions.

import type { MediaItem } from "./types";
import { isHls, formatCount } from "./utils";

// Radio Browser runs mirrored servers; we try each in turn for resilience.
const SERVERS = [
  "https://de1.api.radio-browser.info",
  "https://de2.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
  "https://fi1.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
];

interface RbStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  language: string;
  votes: number;
  codec: string;
  bitrate: number;
  clickcount: number;
}

async function rbFetch<T>(path: string): Promise<T> {
  let lastErr: unknown;
  for (const base of SERVERS) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 9000);
      const res = await fetch(base + path, {
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("All radio servers unreachable");
}

function toItem(s: RbStation): MediaItem | null {
  const src = s.url_resolved || s.url;
  if (!src) return null;
  const tags = (s.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return {
    id: `radio:${s.stationuuid}`,
    kind: "radio",
    title: s.name?.trim() || "Unknown Station",
    subtitle: [s.country, s.codec, s.bitrate ? `${s.bitrate}kbps` : null]
      .filter(Boolean)
      .join(" • "),
    thumbnail: s.favicon || undefined,
    src,
    streamType: isHls(src) ? "hls" : "file",
    isLive: true,
    category: tags[0],
    country: s.country,
    countryCode: s.countrycode?.toLowerCase(),
    tags,
    badge: "LIVE",
    metric: `${formatCount(s.clickcount)} listening`,
    audioOnly: true,
  };
}

function dedupeClean(stations: RbStation[]): MediaItem[] {
  const seen = new Set<string>();
  const out: MediaItem[] = [];
  for (const s of stations) {
    // Prefer https streams to avoid mixed-content blocking on secure pages.
    const src = s.url_resolved || s.url;
    if (!src || !src.startsWith("https://")) continue;
    const item = toItem(s);
    if (!item) continue;
    const key = item.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

const common = "hidebroken=true&is_https=true";

export async function topRadio(limit = 60): Promise<MediaItem[]> {
  const data = await rbFetch<RbStation[]>(
    `/json/stations/topclick/${limit * 2}?${common}`,
  );
  return dedupeClean(data).slice(0, limit);
}

export async function radioByTag(tag: string, limit = 40): Promise<MediaItem[]> {
  const data = await rbFetch<RbStation[]>(
    `/json/stations/bytagexact/${encodeURIComponent(tag)}?order=clickcount&reverse=true&limit=${
      limit * 2
    }&${common}`,
  );
  return dedupeClean(data).slice(0, limit);
}

export async function radioByCountry(code: string, limit = 40): Promise<MediaItem[]> {
  const data = await rbFetch<RbStation[]>(
    `/json/stations/bycountrycodeexact/${encodeURIComponent(
      code,
    )}?order=clickcount&reverse=true&limit=${limit * 2}&${common}`,
  );
  return dedupeClean(data).slice(0, limit);
}

export async function searchRadio(query: string, limit = 40): Promise<MediaItem[]> {
  const data = await rbFetch<RbStation[]>(
    `/json/stations/search?name=${encodeURIComponent(
      query,
    )}&order=clickcount&reverse=true&limit=${limit * 2}&${common}`,
  );
  return dedupeClean(data).slice(0, limit);
}

export const RADIO_GENRES = [
  { id: "news", name: "News & Talk", emoji: "📰" },
  { id: "jazz", name: "Jazz", emoji: "🎷" },
  { id: "classical", name: "Classical", emoji: "🎻" },
  { id: "rock", name: "Rock", emoji: "🎸" },
  { id: "pop", name: "Pop", emoji: "✨" },
  { id: "electronic", name: "Electronic", emoji: "🎛️" },
  { id: "hip hop", name: "Hip-Hop", emoji: "🎤" },
  { id: "dance", name: "Dance", emoji: "💃" },
  { id: "lofi", name: "Lo-Fi", emoji: "🌙" },
  { id: "reggae", name: "Reggae", emoji: "🌴" },
];
