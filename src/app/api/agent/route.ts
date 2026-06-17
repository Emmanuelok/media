import Anthropic from "@anthropic-ai/sdk";
import {
  type AgentPlan,
  validateActions,
  resolveItems,
  searchCatalog,
  agentFallback,
} from "@/lib/agent";
import { topRadio, radioByTag, radioByCountry, searchRadio } from "@/lib/radio";
import { tvByCategory, tvByCountry, FEATURED_TV } from "@/lib/tv";
import { findBroadcasters } from "@/lib/broadcasters";
import type { MediaItem } from "@/lib/types";

export const runtime = "nodejs";

const MODEL = process.env.AURORA_AI_MODEL || "claude-opus-4-8";
const ALLOWED_MODELS = new Set([
  "claude-opus-4-8",
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
  "claude-fable-5",
]);

const AGENT_SYSTEM = `You are Aurora's autonomous concierge. You don't just suggest — you ACT.
Use the search tools to find REAL items (with ids) across the on-demand catalog, live radio, and
live TV, then call present_plan EXACTLY ONCE with a short message and the actions to perform.

Guidelines:
- To play media, gather ids via the search tools first, then include a single "play" action whose
  "ids" form a cohesive queue (you may mix video, music, radio and TV ids).
- Use "search" actions ({kind,q}) to open a live directory page when that fits best (e.g. broad
  "live news" or "world cup" -> kind "tv"; a radio genre -> kind "radio").
- Use "set_sleep_timer" (minutes) for wind-down/sleep requests; "like" to save items; "navigate"
  to a known path (/, /video, /music, /tv, /radio, /library, /channels, /routines, /search, /settings).
- For "where can I watch X" / live-sports rights questions (e.g. the World Cup), call where_to_watch
  (by country and/or query). Then include "watch" actions ({label, url}) using the EXACT urls it
  returns (only those are accepted), and/or navigate to "/channels". Free-to-air results can also be
  opened via a "search" tv action or by navigating to "/tv".
- Keep the message warm and brief (1-2 sentences) describing what you set up.`;

const tools: Anthropic.Tool[] = [
  {
    name: "search_catalog",
    description: "Search Aurora's on-demand video & music catalog. Returns items with ids to play.",
    input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
  {
    name: "search_radio",
    description:
      "Find live radio stations by free-text query, an exact genre tag (e.g. jazz, lofi, news), or a 2-letter ISO country code (e.g. US, GB). Returns playable station items with ids.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string" }, tag: { type: "string" }, country: { type: "string" } },
    },
  },
  {
    name: "search_tv",
    description:
      "Find live TV channels by category (news, sports, movies, music, documentary, kids, science, ...) or a 2-letter ISO country code. Returns playable channel items with ids.",
    input_schema: {
      type: "object",
      properties: { category: { type: "string" }, country: { type: "string" } },
    },
  },
  {
    name: "where_to_watch",
    description:
      "Look up official broadcasters (incl. World Cup rights-holders) by country (name or 2-letter code), free-text query, and/or category. Returns name, country, access (free/provider) and the official url.",
    input_schema: {
      type: "object",
      properties: { country: { type: "string" }, query: { type: "string" }, category: { type: "string" } },
    },
  },
  {
    name: "present_plan",
    description: "Call once when ready to act. Provide a short message and the actions to perform.",
    input_schema: {
      type: "object",
      properties: {
        message: { type: "string" },
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["play", "navigate", "set_sleep_timer", "like", "search", "watch"],
              },
              ids: { type: "array", items: { type: "string" } },
              path: { type: "string" },
              minutes: { type: "number" },
              kind: { type: "string", enum: ["tv", "radio", "video", "music"] },
              q: { type: "string" },
              label: { type: "string" },
              url: { type: "string" },
            },
            required: ["type"],
          },
        },
      },
      required: ["message", "actions"],
    },
  },
];

function str(input: unknown, key: string): string | undefined {
  if (input && typeof input === "object") {
    const v = (input as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

async function runTool(name: string, input: unknown, known: Map<string, MediaItem>): Promise<string> {
  let items: MediaItem[] = [];
  try {
    if (name === "search_catalog") {
      items = searchCatalog(str(input, "query") || "", 10);
    } else if (name === "search_radio") {
      const country = str(input, "country");
      const tag = str(input, "tag");
      const query = str(input, "query");
      items = country
        ? await radioByCountry(country.toUpperCase(), 12)
        : tag
          ? await radioByTag(tag, 12)
          : query
            ? await searchRadio(query, 12)
            : await topRadio(12);
    } else if (name === "search_tv") {
      const category = str(input, "category");
      const country = str(input, "country");
      items = category
        ? await tvByCategory(category.toLowerCase(), 12)
        : country
          ? await tvByCountry(country.toLowerCase(), 12)
          : FEATURED_TV.slice();
    } else if (name === "where_to_watch") {
      const cat = str(input, "category");
      const results = findBroadcasters({
        country: str(input, "country"),
        query: str(input, "query"),
        category: cat === "sports" || cat === "news" || cat === "general" ? cat : undefined,
      }).map((x) => ({ name: x.name, country: x.country, access: x.access, url: x.url }));
      return JSON.stringify({ results });
    } else {
      return JSON.stringify({ error: "unknown tool" });
    }
  } catch {
    return JSON.stringify({ error: "source temporarily unavailable", results: [] });
  }
  for (const it of items) known.set(it.id, it);
  const results = items
    .slice(0, 12)
    .map((i) => ({ id: i.id, title: i.title, subtitle: i.subtitle, kind: i.kind, category: i.category }));
  return JSON.stringify({ results });
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

  const empty: AgentPlan = { message: "Tell me what you'd like and I'll set it up.", actions: [], items: [] };
  if (!prompt.trim()) return Response.json(empty);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json(agentFallback(prompt));

  try {
    const client = new Anthropic({ apiKey });
    const known = new Map<string, MediaItem>();

    const turns = history
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-4);
    while (turns.length && turns[0].role !== "user") turns.shift();
    const messages: Anthropic.MessageParam[] = [
      ...turns.map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      })),
      { role: "user", content: prompt },
    ];

    let plan: AgentPlan | null = null;
    for (let i = 0; i < 6 && !plan; i++) {
      const resp = await client.messages.create({
        model,
        max_tokens: 1024,
        system: AGENT_SYSTEM,
        tools,
        messages,
      });

      if (resp.stop_reason !== "tool_use") {
        const text = resp.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
        plan = { message: text || "Done.", actions: [], items: [] };
        break;
      }

      messages.push({ role: "assistant", content: resp.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of resp.content) {
        if (block.type !== "tool_use") continue;
        if (block.name === "present_plan") {
          const input = (block.input ?? {}) as Record<string, unknown>;
          const actions = validateActions(input.actions);
          const ids = actions.flatMap((a) => (a.type === "play" || a.type === "like" ? a.ids : []));
          plan = {
            message: typeof input.message === "string" ? input.message : "Here's your plan.",
            actions,
            items: resolveItems(ids, known),
          };
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: "ok" });
        } else {
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: await runTool(block.name, block.input, known),
          });
        }
      }
      if (plan) break;
      messages.push({ role: "user", content: toolResults });
    }

    return Response.json(plan ?? { message: "I couldn't complete that — try rephrasing.", actions: [], items: [] });
  } catch (err) {
    console.error("Aurora agent error:", err);
    return Response.json(agentFallback(prompt));
  }
}
