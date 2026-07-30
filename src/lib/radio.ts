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

export const RADIO_BROWSER_USER_AGENT =
  "AuroraMediaHouse/2.0 (+https://media-nu-puce.vercel.app)";

const MAX_CHECK_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const BROWSER_CODECS = new Set(["AAC", "AAC+", "AACPLUS", "MP3", "MPEG"]);

export interface RbStation {
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
  homepage?: string;
  languagecodes?: string;
  hls?: number;
  lastcheckok?: number;
  lastchecktime?: string;
  lastchecktime_iso8601?: string;
  lastcheckoktime?: string;
  lastcheckoktime_iso8601?: string;
  ssl_error?: number;
  timing_ms?: number;
}

export async function radioBrowserFetch<T>(path: string): Promise<T> {
  if (typeof window !== "undefined") {
    const response = await fetch(`/api/radio?path=${encodeURIComponent(path)}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Radio directory HTTP ${response.status}`);
    return (await response.json()) as T;
  }

  let lastErr: unknown;
  for (const base of SERVERS) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    try {
      const res = await fetch(base + path, {
        signal: ctrl.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": RADIO_BROWSER_USER_AGENT,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (e) {
      lastErr = e;
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr ?? new Error("All radio servers unreachable");
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function normaliseCodec(codec: string): string {
  return codec.trim().toUpperCase().replace(/\s+/g, "");
}

function parseTimestamp(value?: string): number | null {
  if (!value) return null;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const normalised = hasZone ? value : `${value.replace(" ", "T")}Z`;
  const timestamp = Date.parse(normalised);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function lastCheckedAt(s: RbStation): number | null {
  return parseTimestamp(
    s.lastchecktime_iso8601 ||
      s.lastchecktime ||
      s.lastcheckoktime_iso8601 ||
      s.lastcheckoktime,
  );
}

function splitLanguages(s: RbStation): string[] {
  const values = [s.language, s.languagecodes]
    .filter(Boolean)
    .flatMap((value) => value!.split(/[;,]/))
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set(values)];
}

function safeWebUrl(value?: string): string | undefined {
  if (!value || !/^https?:\/\//i.test(value)) return undefined;
  return value;
}

export function isReliableRadioStation(
  s: RbStation,
  now = Date.now(),
): boolean {
  const src = s.url_resolved?.trim();
  if (!src?.startsWith("https://")) return false;
  if (Number(s.lastcheckok) !== 1 || Number(s.ssl_error) !== 0) return false;
  if (!BROWSER_CODECS.has(normaliseCodec(s.codec || ""))) return false;

  const checkedAt = lastCheckedAt(s);
  if (checkedAt === null) return false;
  const age = now - checkedAt;
  return age >= -24 * 60 * 60 * 1000 && age <= MAX_CHECK_AGE_MS;
}

function toItem(s: RbStation): MediaItem | null {
  const src = s.url_resolved?.trim();
  if (!src) return null;
  const tags = (s.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const languages = splitLanguages(s);
  const checkedAt = lastCheckedAt(s);
  const codec = normaliseCodec(s.codec || "");
  return {
    id: `radio:${s.stationuuid}:${stableHash(src)}`,
    kind: "radio",
    title: s.name?.trim() || "Unknown Station",
    subtitle: [s.country, s.codec, s.bitrate ? `${s.bitrate}kbps` : null]
      .filter(Boolean)
      .join(" • "),
    thumbnail: s.favicon || undefined,
    src,
    streamType: Number(s.hls) === 1 || isHls(src) ? "hls" : "file",
    isLive: true,
    category: tags[0],
    country: s.country,
    countryCode: s.countrycode?.toLowerCase(),
    tags,
    badge: "LIVE",
    metric: `${formatCount(s.clickcount)} listening`,
    audioOnly: true,
    officialUrl: safeWebUrl(s.homepage),
    language: languages[0],
    languages: languages.length ? languages : undefined,
    codec: codec || undefined,
    bitrate: s.bitrate > 0 ? s.bitrate : undefined,
    health: "verified",
    lastChecked: checkedAt === null ? undefined : new Date(checkedAt).toISOString(),
    healthReason: "Passed Radio Browser's latest distributed stream check.",
    sourceLabel: "Radio Browser",
    sourceKind: "public-directory",
    latencyMs: s.timing_ms && s.timing_ms > 0 ? s.timing_ms : undefined,
    stationUuid: s.stationuuid,
  };
}

export function radioStationsToItems(
  stations: RbStation[],
  now = Date.now(),
): MediaItem[] {
  const seen = new Set<string>();
  const out: MediaItem[] = [];
  for (const s of stations) {
    if (!isReliableRadioStation(s, now)) continue;
    const src = s.url_resolved.trim();
    const item = toItem(s);
    if (!item) continue;
    // A title is not an identity: many independent stations share a network name.
    const key = `${s.stationuuid.toLowerCase()}|${src}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

const common = "hidebroken=true&is_https=true";

export async function topRadio(limit = 60): Promise<MediaItem[]> {
  const data = await radioBrowserFetch<RbStation[]>(
    `/json/stations/topclick/${limit * 4}?${common}`,
  );
  return radioStationsToItems(data).slice(0, limit);
}

export async function radioByTag(tag: string, limit = 40): Promise<MediaItem[]> {
  const data = await radioBrowserFetch<RbStation[]>(
    `/json/stations/bytagexact/${encodeURIComponent(tag)}?order=clickcount&reverse=true&limit=${
      limit * 4
    }&${common}`,
  );
  return radioStationsToItems(data).slice(0, limit);
}

export async function radioByCountry(code: string, limit = 40): Promise<MediaItem[]> {
  const data = await radioBrowserFetch<RbStation[]>(
    `/json/stations/bycountrycodeexact/${encodeURIComponent(
      code,
    )}?order=clickcount&reverse=true&limit=${limit * 4}&${common}`,
  );
  return radioStationsToItems(data).slice(0, limit);
}

export async function searchRadio(query: string, limit = 40): Promise<MediaItem[]> {
  const data = await radioBrowserFetch<RbStation[]>(
    `/json/stations/search?name=${encodeURIComponent(
      query,
    )}&order=clickcount&reverse=true&limit=${limit * 4}&${common}`,
  );
  return radioStationsToItems(data).slice(0, limit);
}

/** Refresh a station record before playback without changing existing catalogue callers. */
export async function resolveRadioStation(
  stationUuid: string,
): Promise<MediaItem | null> {
  const data = await radioBrowserFetch<RbStation[]>(
    `/json/stations/byuuid/${encodeURIComponent(stationUuid)}?${common}`,
  );
  return radioStationsToItems(data)[0] ?? null;
}

/** Radio Browser's redirect endpoint records a click before sending the player onward. */
export function radioPlaybackUrl(stationUuid: string, mirrorIndex = 0): string {
  const index = Math.abs(Math.trunc(mirrorIndex)) % SERVERS.length;
  return `${SERVERS[index]}/json/url/${encodeURIComponent(stationUuid.trim())}`;
}

// Radio Browser uses ISO 3166-1 alpha-2 country codes (e.g. GB, not UK).
export const RADIO_COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
];

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
