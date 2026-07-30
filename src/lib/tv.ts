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

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function idPart(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 52) || "channel"
  );
}

/** A channel can expose multiple feeds, so the URL fingerprint is part of the id. */
function streamCandidateId(sourceId: string | undefined, title: string, src: string): string {
  return `tv:${idPart(sourceId || title)}:${stableHash(src)}`;
}

function splitList(value?: string): string[] {
  if (!value) return [];
  return [...new Set(value.split(/[;,]/).map((part) => part.trim()).filter(Boolean))];
}

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
    const languages = splitList(attr(line, "tvg-language"));
    const countryCode = attr(line, "tvg-country")?.split(/[;,]/)[0]?.trim().toLowerCase();
    const badge = qualityBadge(name) ?? "LIVE";
    items.push({
      id: streamCandidateId(tvgId, name, url),
      kind: "tv",
      title: name.replace(/\s*\((\d+p|4k|uhd|hd)\)\s*/gi, " ").trim() || name,
      subtitle: group || category,
      thumbnail: logo,
      src: url,
      streamType: "hls",
      isLive: true,
      category: category || group?.toLowerCase(),
      countryCode,
      language: languages[0],
      languages: languages.length ? languages : undefined,
      badge,
      health: "unknown",
      sourceLabel: "iptv-org public catalogue",
      sourceKind: "public-directory",
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

type FeaturedTvItem = Omit<
  MediaItem,
  "kind" | "streamType" | "isLive" | "sourceLabel" | "sourceKind" | "health"
> & {
  officialUrl: string;
  language: string;
};

function featuredTv(item: FeaturedTvItem): MediaItem {
  return {
    ...item,
    kind: "tv",
    streamType: "hls",
    isLive: true,
    language: item.language,
    languages: item.languages ?? [item.language],
    health: "likely",
    healthReason: "Curated public broadcaster feed; live availability can vary by region.",
    sourceLabel: "Official broadcaster feed",
    sourceKind: "official",
  };
}

// Hand-picked public broadcaster feeds for an instant, geographically varied home view.
// Each entry includes an official-page fallback because even legitimate HLS endpoints can
// rotate, reject a region, or temporarily block browser playback.
export const FEATURED_TV: MediaItem[] = [
  featuredTv({
    id: "tv:nasa",
    title: "NASA+ Live",
    subtitle: "Science • United States",
    thumbnail: "https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg",
    src: "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8",
    category: "science",
    country: "United States",
    countryCode: "us",
    badge: "HD",
    language: "English",
    officialUrl: "https://www.nasa.gov/live/",
  }),
  featuredTv({
    id: "tv:dw",
    title: "DW English",
    subtitle: "World news • Germany",
    src: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8",
    category: "news",
    country: "Germany",
    countryCode: "de",
    badge: "HD",
    language: "English",
    officialUrl: "https://www.dw.com/en/live-tv/channel-english",
  }),
  featuredTv({
    id: "tv:dwes",
    title: "DW Español",
    subtitle: "World news • Germany",
    src: "https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/index.m3u8",
    category: "news",
    country: "Germany",
    countryCode: "de",
    badge: "HD",
    language: "Spanish",
    officialUrl: "https://www.dw.com/es/multimedia/s-100814",
  }),
  featuredTv({
    id: "tv:ajarabic",
    title: "Al Jazeera Arabic",
    subtitle: "World news • Qatar",
    src: "https://live-hls-web-aja.getaj.net/AJA/index.m3u8",
    category: "news",
    country: "Qatar",
    countryCode: "qa",
    badge: "HD",
    language: "Arabic",
    officialUrl: "https://www.aljazeera.net/live/",
  }),
  featuredTv({
    id: "tv:france24",
    title: "France 24 English",
    subtitle: "World news • France",
    src: "https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8",
    category: "news",
    country: "France",
    countryCode: "fr",
    badge: "HD",
    language: "English",
    officialUrl: "https://www.france24.com/en/live",
  }),
  featuredTv({
    id: "tv:france24es",
    title: "France 24 Español",
    subtitle: "World news • France",
    src: "https://static.france24.com/live/F24_ES_LO_HLS/live_web.m3u8",
    category: "news",
    country: "France",
    countryCode: "fr",
    badge: "HD",
    language: "Spanish",
    officialUrl: "https://www.france24.com/es/en-vivo",
  }),
  featuredTv({
    id: "tv:cbsn",
    title: "CBS News 24/7",
    subtitle: "News • United States",
    src: "https://cbsn-us.cbsnstream.cbsnews.com/out/v1/55a8648e8f134e82a470f83d562deeca/master.m3u8",
    category: "news",
    country: "United States",
    countryCode: "us",
    badge: "HD",
    language: "English",
    officialUrl: "https://www.cbsnews.com/live/",
  }),
  featuredTv({
    id: "tv:nhk",
    title: "NHK World-Japan",
    subtitle: "Culture & news • Japan",
    src: "https://nhkwlive-ojp.akamaized.net/hls/live/2003459/nhkwlive-ojp-en/index.m3u8",
    category: "culture",
    country: "Japan",
    countryCode: "jp",
    badge: "HD",
    language: "English",
    officialUrl: "https://www3.nhk.or.jp/nhkworld/en/live/",
  }),
  featuredTv({
    id: "tv:cgtn",
    title: "CGTN English",
    subtitle: "World news • China",
    src: "https://news.cgtn.com/resource/live/english/cgtn-news.m3u8",
    category: "news",
    country: "China",
    countryCode: "cn",
    badge: "HD",
    language: "English",
    officialUrl: "https://www.cgtn.com/tv",
  }),
  featuredTv({
    id: "tv:trt",
    title: "TRT World",
    subtitle: "World news • Türkiye",
    src: "https://tv-trtworld.medya.trt.com.tr/master.m3u8",
    category: "news",
    country: "Türkiye",
    countryCode: "tr",
    badge: "HD",
    language: "English",
    officialUrl: "https://www.trtworld.com/live",
  }),
  featuredTv({
    id: "tv:rtpi",
    title: "RTP Internacional",
    subtitle: "Culture & entertainment • Portugal",
    src: "https://streaming-live.rtp.pt/liverepeater/smil:rtpi.smil/playlist.m3u8",
    category: "culture",
    country: "Portugal",
    countryCode: "pt",
    badge: "HD",
    language: "Portuguese",
    officialUrl: "https://www.rtp.pt/play/direto/rtpinternacional",
  }),
];
