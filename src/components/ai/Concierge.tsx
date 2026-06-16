"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  X,
  Send,
  Tv,
  Radio,
  Clapperboard,
  Music2,
  Loader2,
  Play,
  Moon,
  Heart,
  Compass,
} from "lucide-react";
import { useUI } from "@/lib/ui";
import { useSettings } from "@/lib/settings";
import { usePlayer } from "@/lib/store";
import { LOCAL_INDEX } from "@/lib/catalog";
import { MediaCard } from "@/components/media/Media";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/lib/types";
import type { AgentAction } from "@/lib/agent";

type Mode = "auto" | "suggest";

interface QueryChip {
  kind: "tv" | "radio" | "video" | "music";
  q: string;
}
interface Msg {
  role: "user" | "assistant";
  content: string;
  picks?: MediaItem[];
  reasons?: Record<string, string>;
  queries?: QueryChip[];
  actions?: AgentAction[];
}

const SUGGESTIONS = [
  "Play something relaxing",
  "Find live news channels",
  "Build a focus mix and a 30-min sleep timer",
  "Show me sci-fi movies",
  "Live sports on right now",
  "Lo-fi radio to study to",
];

const CHIP_ICON = { tv: Tv, radio: Radio, video: Clapperboard, music: Music2 };

export default function Concierge() {
  const open = useUI((s) => s.conciergeOpen);
  const seed = useUI((s) => s.conciergeSeed);
  const conciergeAutoRun = useUI((s) => s.conciergeAutoRun);
  const conciergeRunId = useUI((s) => s.conciergeRunId);
  const close = useUI((s) => s.closeConcierge);
  const aiModel = useSettings((s) => s.aiModel);
  const play = usePlayer((s) => s.play);
  const setSleepTimer = usePlayer((s) => s.setSleepTimer);
  const toggleFavorite = usePlayer((s) => s.toggleFavorite);
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("auto");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ranRef = useRef<number | null>(null);

  useEffect(() => {
    if (open && seed) setInput(seed);
  }, [open, seed]);

  // Auto-run a routine: open in Auto-pilot mode and send the prompt once.
  useEffect(() => {
    if (open && conciergeAutoRun && seed && ranRef.current !== conciergeRunId) {
      ranRef.current = conciergeRunId;
      setMode("auto");
      send(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, conciergeAutoRun, conciergeRunId, seed]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  function goTo(path: string) {
    router.push(path);
    close();
  }

  async function send(text: string) {
    const prompt = text.trim();
    if (!prompt || busy) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: "user", content: prompt }]);
    setInput("");
    setBusy(true);
    try {
      if (mode === "auto") {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, history, model: aiModel }),
        });
        const data = await res.json();
        const items: MediaItem[] = Array.isArray(data.items) ? data.items : [];
        const actions: AgentAction[] = Array.isArray(data.actions) ? data.actions : [];
        const byId = new Map(items.map((it) => [it.id, it]));

        let played: MediaItem[] = [];
        for (const a of actions) {
          if (a.type === "play") {
            const q = a.ids.map((id) => byId.get(id)).filter((x): x is MediaItem => Boolean(x));
            if (q.length) {
              play(q[0], q);
              played = q;
            }
          } else if (a.type === "set_sleep_timer") {
            setSleepTimer(a.minutes);
          } else if (a.type === "like") {
            for (const id of a.ids) {
              const it = byId.get(id);
              if (it) toggleFavorite(it);
            }
          }
        }
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data.message ?? "Done.",
            picks: played.length ? played : items.slice(0, 4),
            actions,
          },
        ]);
      } else {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, history, model: aiModel }),
        });
        const data = await res.json();
        const picks: MediaItem[] = (data.picks ?? [])
          .map((id: string) => LOCAL_INDEX.find((x) => x.id === id))
          .filter(Boolean);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data.reply ?? "Here's what I found.",
            picks,
            reasons: data.reasons ?? {},
            queries: data.queries ?? [],
          },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I couldn't reach the AI service just now — try again in a moment." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={close}
      />
      <aside
        className={cn(
          "fixed right-0 top-0 z-[71] flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0b0b13] shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <div>
              <p className="text-sm font-bold text-white">Aurora AI Concierge</p>
              <p className="text-[11px] text-muted">
                {mode === "auto" ? "Autonomous — I play & set things up" : "I recommend; you tap"}
              </p>
            </div>
          </div>
          <button onClick={close} className="rounded-full p-2 text-muted hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
          <span className="text-[11px] uppercase tracking-wider text-muted">Mode</span>
          <div className="flex rounded-full bg-white/5 p-0.5 text-xs">
            {(["auto", "suggest"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-full px-3 py-1 font-medium transition",
                  mode === m ? "bg-accent text-white" : "text-muted hover:text-white",
                )}
              >
                {m === "auto" ? "Auto-pilot" : "Suggest"}
              </button>
            ))}
          </div>
        </div>

        <div ref={scrollRef} className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="pt-6 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 shadow-lg">
                <Sparkles className="h-7 w-7 text-white" />
              </span>
              <p className="mt-4 text-base font-semibold text-white">How can I curate your day?</p>
              <p className="mt-1 text-sm text-muted">
                {mode === "auto"
                  ? "I'll search across everything and set it up — play a mix, queue channels, set a sleep timer."
                  : "Ask for anything across video, music, live TV and radio."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    onClick={() => send(sug)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/90 transition hover:border-accent/50 hover:bg-white/10"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                  m.role === "user" ? "bg-accent text-white" : "bg-white/[0.07] text-white/90",
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>

                {/* What the agent did */}
                {m.actions && m.actions.some((a) => ["play", "set_sleep_timer", "like"].includes(a.type)) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.actions.map((a, ai) => {
                      if (a.type === "play")
                        return (
                          <span key={ai} className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-medium text-accent">
                            <Play className="h-3 w-3" fill="currentColor" /> Playing {a.ids.length}
                          </span>
                        );
                      if (a.type === "set_sleep_timer")
                        return (
                          <span key={ai} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white">
                            <Moon className="h-3 w-3" /> Sleep {a.minutes}m
                          </span>
                        );
                      if (a.type === "like")
                        return (
                          <span key={ai} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white">
                            <Heart className="h-3 w-3" fill="currentColor" /> Saved {a.ids.length}
                          </span>
                        );
                      return null;
                    })}
                  </div>
                )}

                {m.picks && m.picks.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {m.picks.slice(0, 4).map((it) => (
                      <div key={it.id}>
                        <MediaCard item={it} queue={m.picks} />
                        {m.reasons?.[it.id] && (
                          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted">
                            {m.reasons[it.id]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Agent navigate/search suggestions */}
                {m.actions && m.actions.some((a) => a.type === "navigate" || a.type === "search") && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.actions.map((a, ai) => {
                      if (a.type === "search") {
                        const Icon = CHIP_ICON[a.kind];
                        return (
                          <button
                            key={ai}
                            onClick={() => goTo(`/${a.kind}?q=${encodeURIComponent(a.q)}`)}
                            className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20"
                          >
                            <Icon className="h-3.5 w-3.5" /> {a.q}
                          </button>
                        );
                      }
                      if (a.type === "navigate")
                        return (
                          <button
                            key={ai}
                            onClick={() => goTo(a.path)}
                            className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20"
                          >
                            <Compass className="h-3.5 w-3.5" /> Open {a.path}
                          </button>
                        );
                      return null;
                    })}
                  </div>
                )}

                {/* Classic suggestion chips */}
                {m.queries && m.queries.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.queries.map((qc, qi) => {
                      const Icon = CHIP_ICON[qc.kind];
                      return (
                        <button
                          key={qi}
                          onClick={() => goTo(`/${qc.kind}?q=${encodeURIComponent(qc.q)}`)}
                          className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20"
                        >
                          <Icon className="h-3.5 w-3.5" /> {qc.q}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-white/[0.07] px-3.5 py-2.5 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> {mode === "auto" ? "Working on it…" : "Curating…"}
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-white/10 p-3"
        >
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 focus-within:border-accent/60">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "auto" ? "Tell Aurora what to set up…" : "Ask Aurora anything…"}
              className="flex-1 bg-transparent px-2 text-sm text-white placeholder:text-muted focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-white transition hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
