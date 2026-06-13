// Live TV — real free-to-air channels from the iptv-org public catalog
// (https://github.com/iptv-org/iptv). Thousands of publicly-available channels
// organised by category and country, served as M3U playlists over HLS.
//
// Reality check: arbitrary IPTV streams play in a browser only when their origin
// sends permissive CORS headers and uses HTTPS. Many do; some don't. The curated
// FEATURED list below favours well-known broadcasters that work directly in-browser;
// the full catalog is browsable too, with graceful error states when a stream blocks.
// A production deployment would add a server-side HLS proxy to normalise the rest.

import type { MediaItem } from "./types";

const BASE = "https://iptv-org.github.io/iptv";

export interface TvCategory {
  id: string;
  name: string;
  emoji: string;
}

export const TV_CATEGORIES: TvCategory[] = [
  { id: "news", name: "News", emoji: "📰" },
  { id: "sports", name: "Sports", emoji: "⚽" },
  { id: "movies", name: "Movies", emoji: "🎬" },
  { id: "entertainment", name: "Entertainment", emoji: "🌟" },
  { id: "music", name: "Music", emoji: "🎵" },
  { id: "documentary", name: "Documentary", emoji: "🌍" },
  { id: "kids", name: "Kids", emoji: "🧸" },
  { id: "science", name: "Science", emoji: "🔬" },
  { id: "culture", name: "Culture", emoji: "🎭" },
  { id: "travel", name: "Travel", emoji: "✈️" },
  { id: "weather", name: "Weather", emoji: "⛅" },
  { id: "comedy", name: "Comedy", emoji: "😂" },
];

export const TV_COUNTRIES = [
  { code: "us", name: "United States", flag: "🇺🇸" },
  { code: "uk", name: "United Kingdom", flag: "🇬🇧" },
  { code: "ca", name: "Canada", flag: "🇨🇦" },
  { code: "fr", name: "France", flag: "🇫🇷" },
  { code: "de", name: "Germany", flag: "🇩🇪" },
  { code: "es", name: "Spain", flag: "🇪🇸" },
  { code: "it", name: "Italy", flag: "🇮🇹" },
  { code: "br", name: "Brazil", flag: "🇧🇷" },
  { code: "in", name: "India", flag: "🇮🇳" },
  { code: "ng", name: "Nigeria", flag: "🇳🇬" },
  { code: "za", name: "South Africa", flag: "🇿🇦" },
  { code: "jp", name: "Japan", flag: "🇯🇵" },
  { code: "kr", name: "South Korea", flag: "🇰🇷" },
  { code: "mx", name: "Mexico", flag: "🇲🇽" },
  { code: "ar", name: "Argentina", flag: "🇦🇷" },
  { code: "au", name: "Australia", flag: "🇦🇺" },
];

function qualityBadge(name: string): string | undefined {
  if (/\b(4k|uhd|2160p?)\b/i.test(name)) return "4K";
  if (/\b(1080p?|fhd)\b/i.test(name)) return "HD";
  if (/\b(720p?|hd)\b/i.test(name)) return "HD";
  return undefined;
}

const attr = (line: string, key: string): string | undefined =>
  new RegExp(`${key}="([^"]*)"`).exec(line)?.[1] || undefined;

/** Parse an iptv-org M3U playlist into MediaItems. */
export function parseM3U(text: string, category?: string): MediaItem[] {
  const lines = text.split(/\r?\n/);
  const items: MediaItem[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("#EXTINF")) continue;
    const name = (line.split(",").pop() || "Channel").trim();
    let url = "";
    for (let j = i + 1; j < lines.length && j < i + 4; j++) {
      const u = lines[j].trim();
      if (u && !u.startsWith("#")) {
        url = u;
        break;
      }
    }
    // Keep http(s) streams — HTTP origins are upgraded via the /api/stream proxy.
    if (!url || !/^https?:\/\//i.test(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);

    const logo = attr(line, "tvg-logo");
    const group = attr(line, "group-title");
    const tvgId = attr(line, "tvg-id");
    const badge = qualityBadge(name) ?? "LIVE";
    items.push({
      id: `tv:${tvgId || url}`,
      kind: "tv",
      title: name.replace(/\s*\((\d+p|4k|uhd|hd)\)\s*/gi, " ").trim() || name,
      subtitle: group || category,
      thumbnail: logo,
      src: url,
      streamType: "hls",
      isLive: true,
      category: category || group?.toLowerCase(),
      badge,
    });
  }
  return items;
}

async function fetchM3U(url: string, category?: string): Promise<MediaItem[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseM3U(await res.text(), category);
  } finally {
    clearTimeout(t);
  }
}

export function tvByCategory(category: string, limit = 60): Promise<MediaItem[]> {
  return fetchM3U(`${BASE}/categories/${category}.m3u`, category).then((items) =>
    items.slice(0, limit),
  );
}

export function tvByCountry(code: string, limit = 80): Promise<MediaItem[]> {
  return fetchM3U(`${BASE}/countries/${code}.m3u`).then((items) => items.slice(0, limit));
}

// Hand-picked, broadly-reliable global channels for an instant, populated home view.
// Public broadcasters and 24/7 streams that generally allow direct in-browser playback.
export const FEATURED_TV: MediaItem[] = [
  {
    id: "tv:nasa",
    kind: "tv",
    title: "NASA TV Public",
    subtitle: "Science • United States",
    thumbnail: "https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg",
    src: "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8",
    streamType: "hls",
    isLive: true,
    category: "science",
    country: "United States",
    countryCode: "us",
    badge: "HD",
  },
  {
    id: "tv:redbull",
    kind: "tv",
    title: "Red Bull TV",
    subtitle: "Sports & Adventure • Global",
    thumbnail: "https://i.imgur.com/zNQX0sd.png",
    src: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
    streamType: "hls",
    isLive: true,
    category: "sports",
    country: "Global",
    badge: "HD",
  },
  {
    id: "tv:dw",
    kind: "tv",
    title: "DW English",
    subtitle: "News • Germany",
    src: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8",
    streamType: "hls",
    isLive: true,
    category: "news",
    country: "Germany",
    countryCode: "de",
    badge: "HD",
  },
  {
    id: "tv:aljazeera",
    kind: "tv",
    title: "Al Jazeera English",
    subtitle: "News • Qatar",
    src: "https://live-hls-web-aje.getaj.net/AJE/01.m3u8",
    streamType: "hls",
    isLive: true,
    category: "news",
    country: "Qatar",
    badge: "HD",
  },
  {
    id: "tv:france24",
    kind: "tv",
    title: "France 24 English",
    subtitle: "News • France",
    src: "https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8",
    streamType: "hls",
    isLive: true,
    category: "news",
    country: "France",
    countryCode: "fr",
    badge: "HD",
  },
  {
    id: "tv:bloomberg",
    kind: "tv",
    title: "Bloomberg TV",
    subtitle: "Business News • United States",
    src: "https://bloomberg-bloomberg-1-gb.samsung.wurl.tv/playlist.m3u8",
    streamType: "hls",
    isLive: true,
    category: "news",
    country: "United States",
    countryCode: "us",
    badge: "HD",
  },
  {
    id: "tv:abcnews",
    kind: "tv",
    title: "ABC News Live",
    subtitle: "News • United States",
    src: "https://content.uplynk.com/channel/3324f2467c414329b3b0cc5cd987b6be.m3u8",
    streamType: "hls",
    isLive: true,
    category: "news",
    country: "United States",
    countryCode: "us",
    badge: "HD",
  },
  {
    id: "tv:cbsn",
    kind: "tv",
    title: "CBS News",
    subtitle: "News • United States",
    src: "https://cbsn-us.cbsnstream.cbsnews.com/out/v1/55a8648e8f134e82a470f83d562deeca/master.m3u8",
    streamType: "hls",
    isLive: true,
    category: "news",
    country: "United States",
    countryCode: "us",
    badge: "HD",
  },
];
