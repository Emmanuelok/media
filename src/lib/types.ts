// Core domain model for the Aurora AI Media House.
// A single unified MediaItem represents anything playable — a video, a song,
// a live TV channel, or a radio station — so the global player can handle them all.

export type MediaKind = "video" | "music" | "tv" | "radio";

/** Best-known playback state for live media. */
export type LiveHealthState =
  | "verified"
  | "likely"
  | "degraded"
  | "offline"
  | "unknown";

/** Provenance of a live source. */
export type LiveSourceKind =
  | "official"
  | "public-directory"
  | "community"
  | "local"
  | "generated";

export interface MediaItem {
  id: string;
  kind: MediaKind;
  title: string;
  /** Artist, channel name, country, or uploader. */
  subtitle?: string;
  description?: string;
  /** Poster / album art / channel logo. */
  thumbnail?: string;
  /** Playable URL (mp4, m3u8 HLS, or audio stream). */
  src: string;
  streamType?: "hls" | "file";
  isLive?: boolean;
  /** Seconds, for on-demand video/music. Live streams omit this. */
  duration?: number;
  /** Genre / "News" / "Sports" / etc. */
  category?: string;
  country?: string;
  countryCode?: string;
  tags?: string[];
  /** Small overlay label, e.g. "4K", "LIVE", "HD". */
  badge?: string;
  /** Stat shown on cards (views, listeners, votes). */
  metric?: string;
  /** True for music & radio — render with the audio surface, not the video stage. */
  audioOnly?: boolean;
  /** Broadcaster or station page to offer when embedded playback is unavailable. */
  officialUrl?: string;
  /** Primary language and, where available, all listed languages. */
  language?: string;
  languages?: string[];
  /** Live audio/video codec and advertised bitrate in kilobits per second. */
  codec?: string;
  bitrate?: number;
  /** Latest known live-source state and when that state was checked. */
  health?: LiveHealthState;
  lastChecked?: string;
  healthReason?: string;
  /** Human-readable catalogue provenance. */
  sourceLabel?: string;
  sourceKind?: LiveSourceKind;
  /** Optional diagnostics supplied by a source directory. */
  latencyMs?: number;
  failureCount?: number;
  /** Stable upstream station identifier, separate from this stream candidate's id. */
  stationUuid?: string;
}

export interface Category {
  id: string;
  name: string;
  emoji?: string;
}

/** A horizontal carousel of media on a discovery page. */
export interface Shelf {
  id: string;
  title: string;
  subtitle?: string;
  items: MediaItem[];
}
