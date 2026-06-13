// On-demand Video (YouTube-style) and Music (Spotify-style) catalog.
// Built on free, openly-licensed, CORS-enabled media that plays reliably in any browser:
//   • Video: Blender open movies & Google sample clips + adaptive HLS demo streams.
//   • Music: openly-licensed audio (SoundHelix) for a fully working player & queue.
// Swapping in your own CDN / object storage is a one-line change per item.

import type { MediaItem, Shelf } from "./types";

const GB = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample";

const v = (
  id: string,
  title: string,
  subtitle: string,
  file: string,
  thumb: string,
  category: string,
  badge: string,
  metric: string,
  duration?: number,
): MediaItem => ({
  id: `video:${id}`,
  kind: "video",
  title,
  subtitle,
  thumbnail: thumb,
  src: file,
  streamType: file.includes(".m3u8") ? "hls" : "file",
  category,
  badge,
  metric,
  duration,
  description: `${title} — streaming on Aurora.`,
});

export const VIDEOS: MediaItem[] = [
  v(
    "bbb",
    "Big Buck Bunny",
    "Blender Studio",
    `${GB}/BigBuckBunny.mp4`,
    `${GB}/images/BigBuckBunny.jpg`,
    "Animation",
    "4K",
    "24M views",
    596,
  ),
  v(
    "sintel",
    "Sintel",
    "Blender Foundation",
    `${GB}/Sintel.mp4`,
    `${GB}/images/Sintel.jpg`,
    "Animation",
    "4K",
    "18M views",
    888,
  ),
  v(
    "tears",
    "Tears of Steel",
    "Blender Foundation",
    `${GB}/TearsOfSteel.mp4`,
    `${GB}/images/TearsOfSteel.jpg`,
    "Sci-Fi",
    "4K",
    "12M views",
    734,
  ),
  v(
    "elephant",
    "Elephant's Dream",
    "Orange Open Movie",
    `${GB}/ElephantsDream.mp4`,
    `${GB}/images/ElephantsDream.jpg`,
    "Animation",
    "HD",
    "9.1M views",
    654,
  ),
  v(
    "apple4k",
    "Adaptive Bitrate Showcase (HEVC)",
    "Aurora Labs",
    "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_adv_example_hevc/master.m3u8",
    `${GB}/images/ForBiggerBlazes.jpg`,
    "Tech",
    "4K",
    "3.4M views",
  ),
  v(
    "mux",
    "Cinematic Demo Reel",
    "Aurora Originals",
    "https://stream.mux.com/v69RSHhFelSm4701snP22dYz2jICy4E4FUyk02rW4gxRM.m3u8",
    `${GB}/images/ForBiggerJoyrides.jpg`,
    "Originals",
    "4K",
    "5.7M views",
  ),
  v(
    "blazes",
    "For Bigger Blazes",
    "Aurora Shorts",
    `${GB}/ForBiggerBlazes.mp4`,
    `${GB}/images/ForBiggerBlazes.jpg`,
    "Shorts",
    "HD",
    "2.2M views",
    15,
  ),
  v(
    "escapes",
    "For Bigger Escape",
    "Aurora Shorts",
    `${GB}/ForBiggerEscapes.mp4`,
    `${GB}/images/ForBiggerEscapes.jpg`,
    "Shorts",
    "HD",
    "1.8M views",
    15,
  ),
  v(
    "fun",
    "For Bigger Fun",
    "Aurora Shorts",
    `${GB}/ForBiggerFun.mp4`,
    `${GB}/images/ForBiggerFun.jpg`,
    "Shorts",
    "HD",
    "3.1M views",
    60,
  ),
  v(
    "meltdowns",
    "For Bigger Meltdowns",
    "Aurora Shorts",
    `${GB}/ForBiggerMeltdowns.mp4`,
    `${GB}/images/ForBiggerMeltdowns.jpg`,
    "Shorts",
    "HD",
    "990K views",
    15,
  ),
  v(
    "subaru",
    "Street & Dirt",
    "Wheels Channel",
    `${GB}/SubaruOutbackOnStreetAndDirt.mp4`,
    `${GB}/images/SubaruOutbackOnStreetAndDirt.jpg`,
    "Autos",
    "HD",
    "740K views",
    594,
  ),
  v(
    "vw",
    "GTI Review",
    "Wheels Channel",
    `${GB}/VolkswagenGTIReview.mp4`,
    `${GB}/images/VolkswagenGTIReview.jpg`,
    "Autos",
    "HD",
    "1.1M views",
    170,
  ),
];

// ---- Music ----

const SH = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-";

const ARTISTS = [
  "Aurora Collective",
  "Neon Tide",
  "Midnight Atlas",
  "Solar Bloom",
  "Echo Vista",
  "Velvet Static",
];
const ALBUMS = [
  "After Hours",
  "Chromatic",
  "Lighthouse",
  "Paper Skies",
  "Goldenrod",
  "Slow Motion",
];

export const TRACKS: MediaItem[] = Array.from({ length: 14 }, (_, i) => {
  const n = i + 1;
  const artist = ARTISTS[i % ARTISTS.length];
  const album = ALBUMS[i % ALBUMS.length];
  return {
    id: `music:${n}`,
    kind: "music",
    title: `${album} — Pt. ${((i % 4) + 1)}`,
    subtitle: artist,
    description: album,
    src: `${SH}${n}.mp3`,
    streamType: "file" as const,
    category: ["Pop", "Electronic", "Lo-Fi", "Indie", "Ambient", "Dance"][i % 6],
    metric: `${(Math.floor(Math.random() * 90) + 10)}M plays`,
    duration: 240 + i * 7,
    audioOnly: true,
  };
});

export interface Playlist {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  trackIds: string[];
}

export const PLAYLISTS: Playlist[] = [
  {
    id: "focus",
    title: "Deep Focus",
    subtitle: "Instrumental flow",
    emoji: "🎯",
    trackIds: TRACKS.slice(0, 6).map((t) => t.id),
  },
  {
    id: "night",
    title: "Late Night Drive",
    subtitle: "After-hours synth",
    emoji: "🌃",
    trackIds: TRACKS.slice(4, 10).map((t) => t.id),
  },
  {
    id: "energy",
    title: "Peak Energy",
    subtitle: "Move your body",
    emoji: "⚡",
    trackIds: TRACKS.slice(6, 14).map((t) => t.id),
  },
  {
    id: "chill",
    title: "Sunday Chill",
    subtitle: "Easy & warm",
    emoji: "☕",
    trackIds: TRACKS.slice(0, 8).map((t) => t.id),
  },
];

export function tracksFor(ids: string[]): MediaItem[] {
  const map = new Map(TRACKS.map((t) => [t.id, t]));
  return ids.map((id) => map.get(id)).filter((t): t is MediaItem => Boolean(t));
}

/** Everything on-demand, for the universal AI search index. */
export const LOCAL_INDEX: MediaItem[] = [...VIDEOS, ...TRACKS];

export const HOME_SHELVES: Shelf[] = [
  { id: "trending", title: "Trending Now", subtitle: "What the world is watching", items: VIDEOS.slice(0, 6) },
  { id: "music", title: "New Music", subtitle: "Fresh on Aurora Sound", items: TRACKS.slice(0, 8) },
  { id: "shorts", title: "Quick Watches", items: VIDEOS.filter((x) => x.category === "Shorts") },
];
