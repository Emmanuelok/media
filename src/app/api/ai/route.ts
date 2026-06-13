import Anthropic from "@anthropic-ai/sdk";
import { LOCAL_INDEX } from "@/lib/catalog";

export const runtime = "nodejs";

// Default to the latest, most capable Claude model. Override via env if desired.
const MODEL = process.env.AURORA_AI_MODEL || "claude-opus-4-8";
// Server-side allowlist — clients may pick from these, nothing else.
const ALLOWED_MODELS = new Set([
  "claude-opus-4-8",
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
  "claude-fable-5",
]);

const CATALOG = LOCAL_INDEX.map(
  (i) => `${i.id} | ${i.kind} | "${i.title}" by ${i.subtitle ?? "?"} [${i.category ?? ""}]`,
).join("\n");

const SYSTEM = `You are Aurora, the AI concierge for "Aurora" — a unified media house combining
on-demand video, music, live TV, and live radio from around the world.

Your job: understand what the user is in the mood for and curate across every medium.

ON-DEMAND CATALOG (you may recommend these by their exact id):
${CATALOG}

LIVE TV & RADIO are dynamic global directories you cannot pick by id. Instead, suggest up to 3
search queries the user can tap, each as {"kind":"tv"|"radio","q":"<short query>"}.
Examples: live news -> {"kind":"tv","q":"news"}; world cup / football -> {"kind":"tv","q":"sports"};
lofi study beats -> {"kind":"radio","q":"lofi"}; jazz -> {"kind":"radio","q":"jazz"}.

Respond with a warm, concise reply (1-3 sentences) and your selections.

OUTPUT FORMAT — respond with ONLY a JSON object, no prose, no markdown fences:
{"reply": string, "picks": string[] (0-4 catalog ids), "queries": [{"kind": "tv"|"radio"|"video"|"music", "q": string}] (0-3)}`;

type Query = { kind: "tv" | "radio" | "video" | "music"; q: string };
interface AiResult {
  reply: string;
  picks: string[];
  queries: Query[];
}

const VALID_IDS = new Set(LOCAL_INDEX.map((i) => i.id));

/** Pull a JSON object out of a model response that may include fences or stray prose. */
function extractJson(text: string): AiResult | null {
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

function sanitize(r: Partial<AiResult> | null, fallbackReply: string): AiResult {
  return {
    reply: typeof r?.reply === "string" && r.reply.trim() ? r.reply.trim() : fallbackReply,
    picks: Array.isArray(r?.picks) ? r!.picks.filter((id) => VALID_IDS.has(id)).slice(0, 4) : [],
    queries: Array.isArray(r?.queries)
      ? r!.queries
          .filter(
            (q): q is Query =>
              !!q && typeof q.q === "string" && ["tv", "radio", "video", "music"].includes(q.kind),
          )
          .slice(0, 3)
      : [],
  };
}

/** Keyword-based curation used when no Anthropic key is configured. */
function localFallback(prompt: string): AiResult {
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

export async function POST(req: Request) {
  let prompt = "";
  let history: { role: string; content: string }[] = [];
  let model = MODEL;
  try {
    const body = await req.json();
    prompt = String(body.prompt ?? "").slice(0, 2000);
    if (Array.isArray(body.history)) history = body.history;
    if (typeof body.model === "string" && ALLOWED_MODELS.has(body.model)) model = body.model;
  } catch {
    /* ignore bad body */
  }
  if (!prompt.trim()) {
    return Response.json({ reply: "Tell me what you're in the mood for!", picks: [], queries: [] });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(localFallback(prompt));
  }

  try {
    const client = new Anthropic({ apiKey });

    // Build a clean, user-first message list.
    const turns = history
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-6);
    while (turns.length && turns[0].role !== "user") turns.shift();
    const messages: Anthropic.MessageParam[] = [
      ...turns.map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      })),
      { role: "user", content: prompt },
    ];

    const resp = await client.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM,
      messages,
    });

    const text = resp.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    const parsed = extractJson(text);
    return Response.json(sanitize(parsed, text || "Here are a few ideas for you."));
  } catch (err) {
    console.error("Aurora AI error:", err);
    const fb = localFallback(prompt);
    return Response.json({
      ...fb,
      reply:
        "I hit a snag reaching the AI service, so here are some quick picks. Check your ANTHROPIC_API_KEY and try again.",
    });
  }
}
