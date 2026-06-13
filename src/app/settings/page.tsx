"use client";

import { Settings as SettingsIcon, Check, Trash2, Sparkles, Keyboard } from "lucide-react";
import { useSettings, AI_MODELS, ACCENTS } from "@/lib/settings";
import { usePlayer } from "@/lib/store";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";

const SHORTCUTS: [string, string][] = [
  ["Space", "Play / pause"],
  ["← / →", "Seek ∓ 10s"],
  ["↑ / ↓", "Volume"],
  ["M", "Mute"],
  ["N / P", "Next / previous"],
  ["F", "Theater mode (video)"],
];

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-surface/50 p-5">
      <h2 className="text-base font-bold text-white">{title}</h2>
      {desc && <p className="mt-0.5 text-sm text-muted">{desc}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const aiModel = useSettings((s) => s.aiModel);
  const setAiModel = useSettings((s) => s.setAiModel);
  const accent = useSettings((s) => s.accent);
  const setAccent = useSettings((s) => s.setAccent);

  const autoplay = usePlayer((s) => s.autoplay);
  const setAutoplay = usePlayer((s) => s.setAutoplay);
  const clearFavorites = usePlayer((s) => s.clearFavorites);
  const clearHistory = usePlayer((s) => s.clearHistory);
  const favCount = usePlayer((s) => s.favorites.length);
  const recCount = usePlayer((s) => s.recents.length);

  return (
    <div className="animate-fade-up max-w-2xl">
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        subtitle="Tune the AI, playback, appearance and your data"
        accent="bg-gradient-to-br from-slate-500 to-zinc-700"
      />

      <div className="space-y-5">
        <Section
          title="AI Concierge model"
          desc="Which Claude model powers recommendations. Requires ANTHROPIC_API_KEY on the server — otherwise the concierge uses an offline fallback."
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AI_MODELS.map((m) => {
              const active = aiModel === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setAiModel(m.id)}
                  className={cn(
                    "relative rounded-xl border p-3 text-left transition",
                    active
                      ? "border-accent bg-accent/10"
                      : "border-white/10 bg-white/5 hover:border-white/20",
                  )}
                >
                  {active && (
                    <Check className="absolute right-2 top-2 h-4 w-4 text-accent" strokeWidth={3} />
                  )}
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    <Sparkles className="h-3.5 w-3.5 text-accent" /> {m.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">{m.hint}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Playback">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Autoplay next</p>
              <p className="text-xs text-muted">Continue to the next item when the current one ends.</p>
            </div>
            <button
              role="switch"
              aria-checked={autoplay}
              aria-label="Autoplay next"
              onClick={() => setAutoplay(!autoplay)}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition",
                autoplay ? "bg-accent" : "bg-white/15",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                  autoplay ? "left-[22px]" : "left-0.5",
                )}
              />
            </button>
          </div>
        </Section>

        <Section title="Appearance" desc="Pick an accent color for the whole app.">
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map((a) => {
              const active = accent === a.value;
              return (
                <button
                  key={a.id}
                  onClick={() => setAccent(a.value)}
                  aria-label={`Accent ${a.id}`}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full transition hover:scale-110",
                    active && "ring-2 ring-white ring-offset-2 ring-offset-bg",
                  )}
                  style={{ background: a.value }}
                >
                  {active && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Your data" desc="Stored only in this browser.">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                if (confirm(`Remove all ${favCount} favorites?`)) clearFavorites();
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:border-red-500/50 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear favorites ({favCount})
            </button>
            <button
              onClick={() => {
                if (confirm("Clear play history and resume positions?")) clearHistory();
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:border-red-500/50 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear history ({recCount})
            </button>
          </div>
        </Section>

        <Section title="Keyboard shortcuts">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SHORTCUTS.map(([key, desc]) => (
              <div key={key} className="flex items-center gap-3">
                <kbd className="inline-flex min-w-10 justify-center rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs font-semibold text-white">
                  {key}
                </kbd>
                <span className="text-sm text-muted">{desc}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <Keyboard className="h-3.5 w-3.5" /> Shortcuts work whenever you&apos;re not typing in a field.
          </p>
        </Section>
      </div>
    </div>
  );
}
