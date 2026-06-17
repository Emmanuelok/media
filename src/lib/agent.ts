import { LOCAL_INDEX } from "./catalog";
import { localFallback } from "./concierge";
import { BROADCASTER_URLS } from "./broadcasters";
import type { MediaItem } from "./types";

// The Aurora agent: Claude searches across the catalog, live radio, and live TV,
// then returns a PLAN of actions the client executes on the user's behalf —
// playing a queue, setting a sleep timer, liking items, navigating, or opening a
// live search. This module holds the pure, testable pieces (no network, no SDK).

export type AgentAction =
  | { type: "play"; ids: string[] }
  | { type: "navigate"; path: string }
  | { type: "set_sleep_timer"; minutes: number }
  | { type: "like"; ids: string[] }
  | { type: "search"; kind: "tv" | "radio" | "video" | "music"; q: string }
  | { type: "watch"; label: string; url: string };

export interface AgentPlan {
  message: string;
  actions: AgentAction[];
  /** Resolved MediaItems referenced by play/like actions, for the client. */
  items: MediaItem[];
}

const NAV_PATHS = new Set([
  "/",
  "/video",
  "/music",
  "/tv",
  "/radio",
  "/library",
  "/search",
  "/settings",
  "/channels",
  "/routines",
]);
const KINDS = new Set(["tv", "radio", "video", "music"]);

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}
function stringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 50) : [];
}

/** Validate/normalize raw actions from the model into a safe AgentAction[]. */
export function validateActions(raw: unknown): AgentAction[] {
  if (!Array.isArray(raw)) return [];
  const out: AgentAction[] = [];
  for (const entry of raw) {
    const a = asRecord(entry);
    if (!a) continue;
    const t = a.type;
    if (t === "play") out.push({ type: "play", ids: stringArray(a.ids) });
    else if (t === "like") out.push({ type: "like", ids: stringArray(a.ids) });
    else if (t === "set_sleep_timer" && typeof a.minutes === "number")
      out.push({ type: "set_sleep_timer", minutes: Math.max(1, Math.min(180, Math.round(a.minutes))) });
    else if (t === "navigate" && typeof a.path === "string" && NAV_PATHS.has(a.path))
      out.push({ type: "navigate", path: a.path });
    else if (
      t === "search" &&
      typeof a.q === "string" &&
      typeof a.kind === "string" &&
      KINDS.has(a.kind)
    )
      out.push({ type: "search", kind: a.kind as "tv" | "radio" | "video" | "music", q: a.q.slice(0, 80) });
    else if (
      t === "watch" &&
      typeof a.url === "string" &&
      typeof a.label === "string" &&
      BROADCASTER_URLS.has(a.url)
    )
      out.push({ type: "watch", label: a.label.slice(0, 80), url: a.url });
    if (out.length >= 12) break;
  }
  return out;
}

/** Resolve play/like ids into MediaItems using items gathered during the run. */
export function resolveItems(ids: string[], known: Map<string, MediaItem>): MediaItem[] {
  const out: MediaItem[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    const item = known.get(id) || LOCAL_INDEX.find((i) => i.id === id);
    if (item) {
      out.push(item);
      seen.add(id);
    }
  }
  return out;
}

/** Search the on-demand catalog (pure). */
export function searchCatalog(query: string, limit = 8): MediaItem[] {
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  if (!words.length) return [];
  return LOCAL_INDEX.filter((i) => {
    const hay = `${i.title} ${i.subtitle ?? ""} ${i.category ?? ""}`.toLowerCase();
    return words.some((w) => hay.includes(w));
  }).slice(0, limit);
}

/** Heuristic plan used when no Anthropic key is configured. */
export function agentFallback(prompt: string): AgentPlan {
  const base = localFallback(prompt);
  const matches = searchCatalog(prompt, 6);
  const playIds = (matches.length ? matches.map((i) => i.id) : base.picks).slice(0, 8);
  const items = resolveItems(playIds, new Map());

  const actions: AgentAction[] = [];
  if (items.length) actions.push({ type: "play", ids: items.map((i) => i.id) });
  for (const q of base.queries) actions.push({ type: "search", kind: q.kind, q: q.q });
  if (/\b(sleep|bedtime|nap|wind down)\b/i.test(prompt)) actions.push({ type: "set_sleep_timer", minutes: 30 });
  if (/\b(watch|where|world ?cup|broadcast|rights|channel)\b/i.test(prompt) && !actions.some((a) => a.type === "navigate"))
    actions.push({ type: "navigate", path: "/channels" });

  const message = items.length
    ? "Queued some matches and lined up live options. Connect an ANTHROPIC_API_KEY for full autonomous control."
    : "I can act across Aurora once ANTHROPIC_API_KEY is set — meanwhile, here are live options to explore.";
  return { message, actions, items };
}
