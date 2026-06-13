import { LOCAL_INDEX } from "./catalog";

// Pure helpers for the AI concierge (/api/ai): parsing the model's JSON,
// sanitizing it, and the offline keyword fallback. Unit-tested.

export interface Query {
  kind: "tv" | "radio" | "video" | "music";
  q: string;
}
export interface AiResult {
  reply: string;
  picks: string[];
  queries: Query[];
}

const VALID_IDS = new Set(LOCAL_INDEX.map((i) => i.id));

/** Pull a JSON object out of a model response that may include fences or stray prose. */
export function extractJson(text: string): Partial<AiResult> | null {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function sanitize(r: Partial<AiResult> | null, fallbackReply: string): AiResult {
  return {
    reply: typeof r?.reply === "string" && r.reply.trim() ? r.reply.trim() : fallbackReply,
    picks: Array.isArray(r?.picks) ? r.picks.filter((id) => VALID_IDS.has(id)).slice(0, 4) : [],
    queries: Array.isArray(r?.queries)
      ? r.queries
          .filter(
            (q): q is Query =>
              !!q && typeof q.q === "string" && ["tv", "radio", "video", "music"].includes(q.kind),
          )
          .slice(0, 3)
      : [],
  };
}

/** Keyword-based curation used when no Anthropic key is configured. */
export function localFallback(prompt: string): AiResult {
  const p = prompt.toLowerCase();
  const words = p.split(/\W+/).filter((w) => w.length > 3);
  const picks = LOCAL_INDEX.filter((i) => {
    const hay = `${i.title} ${i.subtitle ?? ""} ${i.category ?? ""}`.toLowerCase();
    return words.some((w) => hay.includes(w));
  })
    .slice(0, 4)
    .map((i) => i.id);

  const queries: Query[] = [];
  const add = (kind: Query["kind"], q: string) => {
    if (queries.length < 3 && !queries.some((x) => x.q === q)) queries.push({ kind, q });
  };
  if (/news|headline|current/.test(p)) add("tv", "news");
  if (/sport|football|soccer|world ?cup|game|match/.test(p)) add("tv", "sports");
  if (/lofi|study|focus|chill|relax|sleep/.test(p)) add("radio", "lofi");
  if (/jazz/.test(p)) add("radio", "jazz");
  if (/rock/.test(p)) add("radio", "rock");
  if (/classic/.test(p)) add("radio", "classical");
  if (/news|world|global/.test(p) && queries.length < 3) add("radio", "news");
  if (/movie|film|sci-?fi|cinema/.test(p)) add("video", "movie");

  const reply =
    picks.length || queries.length
      ? "Here's what I lined up across Aurora. Tip: set an ANTHROPIC_API_KEY to unlock full conversational AI curation."
      : "I'd love to help curate this. For the smartest results, set ANTHROPIC_API_KEY — meanwhile, explore Live TV and Radio for thousands of global channels.";
  return { reply, picks, queries };
}
