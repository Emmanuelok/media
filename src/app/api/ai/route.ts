import Anthropic from "@anthropic-ai/sdk";
import { LOCAL_INDEX } from "@/lib/catalog";
import { localFallback, extractJson, sanitize } from "@/lib/concierge";

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

Respond with a warm, concise reply (1-3 sentences) and your selections. For each catalog pick,
include a one-line reason (max ~14 words) explaining why it fits, in "reasons" keyed by the pick id.

OUTPUT FORMAT — respond with ONLY a JSON object, no prose, no markdown fences:
{"reply": string, "picks": string[] (0-4 catalog ids), "reasons": {"<pick id>": "<short why>"}, "queries": [{"kind": "tv"|"radio"|"video"|"music", "q": string}] (0-3)}`;

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
    return Response.json(sanitize(extractJson(text), text || "Here are a few ideas for you."));
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
