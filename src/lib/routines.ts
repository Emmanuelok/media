// One-tap agentic routines. Each routine is a natural-language instruction sent
// to the Aurora agent (Auto-pilot), which then acts: builds a queue, opens live
// channels, sets a sleep timer, etc. Pure data so it can be unit-tested and used
// on server or client. Custom routines live in routines-store.ts.

export interface Routine {
  id: string;
  title: string;
  emoji: string;
  prompt: string;
  description?: string;
}

/** A routine scheduled to auto-run at a local time of day (while Aurora is open). */
export interface Schedule {
  id: string;
  label: string;
  prompt: string;
  time: string; // "HH:MM" local
  enabled: boolean;
  lastFired: string | null; // local date key, so it fires at most once per day
}

/** Local YYYY-MM-DD key (not UTC) so "once per day" matches the user's clock. */
export function todayKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

/** Is this schedule due to fire at `now`? (enabled, matches the minute, not yet fired today) */
export function isScheduleDue(s: Schedule, now: Date): boolean {
  if (!s.enabled) return false;
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return s.time === hhmm && s.lastFired !== todayKey(now);
}

export const DEFAULT_ROUTINES: Routine[] = [
  {
    id: "focus",
    title: "Focus session",
    emoji: "🎯",
    description: "Instrumental flow + a 50-min timer",
    prompt: "Start a deep-focus instrumental music mix and set a 50 minute sleep timer.",
  },
  {
    id: "news",
    title: "Catch up on news",
    emoji: "📰",
    description: "Top live news channels",
    prompt: "Open the best live news TV channels available right now.",
  },
  {
    id: "workout",
    title: "Workout",
    emoji: "🏋️",
    description: "High-energy music queue",
    prompt: "Build a high-energy workout music queue and start playing it.",
  },
  {
    id: "winddown",
    title: "Wind down",
    emoji: "🌙",
    description: "Calm lo-fi + a 30-min timer",
    prompt: "Play calm lo-fi music to relax and set a 30 minute sleep timer.",
  },
  {
    id: "discover",
    title: "Surprise me",
    emoji: "✨",
    description: "Something new across Aurora",
    prompt: "Surprise me — play something great I might not have seen, mixing video and music.",
  },
  {
    id: "sports",
    title: "Live sports",
    emoji: "⚽",
    description: "What's on right now",
    prompt: "Find live sports channels that are on right now.",
  },
];
