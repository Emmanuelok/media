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
