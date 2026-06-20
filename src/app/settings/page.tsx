"use client";

import { useState } from "react";
import {
  Settings as SettingsIcon,
  Check,
  Trash2,
  Sparkles,
  Keyboard,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
} from "lucide-react";
import { useSettings, AI_MODELS, ACCENTS } from "@/lib/settings";
import { usePlayer } from "@/lib/store";
import { buildSnapshot, applySnapshot } from "@/lib/sync";
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
  const aiNote = useSettings((s) => s.aiNote);
  const setAiNote = useSettings((s) => s.setAiNote);
  const notifyRoutines = useSettings((s) => s.notifyRoutines);
  const setNotifyRoutines = useSettings((s) => s.setNotifyRoutines);
  const forceProxyTv = useSettings((s) => s.forceProxyTv);
  const setForceProxyTv = useSettings((s) => s.setForceProxyTv);

  const autoplay = usePlayer((s) => s.autoplay);
  const setAutoplay = usePlayer((s) => s.setAutoplay);
  const autoDj = usePlayer((s) => s.autoDj);
  const setAutoDj = usePlayer((s) => s.setAutoDj);
  const sleepAt = usePlayer((s) => s.sleepAt);
  const setSleepTimer = usePlayer((s) => s.setSleepTimer);
  const clearFavorites = usePlayer((s) => s.clearFavorites);
  const clearHistory = usePlayer((s) => s.clearHistory);
  const favCount = usePlayer((s) => s.favorites.length);
  const recCount = usePlayer((s) => s.recents.length);

  const toggleNotify = async () => {
    if (notifyRoutines) return setNotifyRoutines(false);
    if (typeof Notification === "undefined") return setNotifyRoutines(false);
    const perm =
      Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission;
    setNotifyRoutines(perm === "granted");
  };

  const syncCode = useSettings((s) => s.syncCode);
  const setSyncCode = useSettings((s) => s.setSyncCode);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const pushSync = async () => {
    const code = syncCode.trim();
    if (!code) return setSyncMsg("Enter or generate a code first.");
    setSyncBusy(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, data: buildSnapshot() }),
      });
      const d = await res.json();
      setSyncMsg(
        res.ok
          ? d.durable
            ? "✓ Saved to the cloud."
            : "✓ Saved (dev / in-memory — set KV env for durable cross-device sync)."
          : d.error || "Failed to save.",
      );
    } catch {
      setSyncMsg("Network error.");
    } finally {
      setSyncBusy(false);
    }
  };

  const pullSync = async () => {
    const code = syncCode.trim();
    if (!code) return setSyncMsg("Enter your code first.");
    if (!confirm("Replace this device's library, settings & routines with the synced copy?")) return;
    setSyncBusy(true);
    setSyncMsg("");
    try {
      const res = await fetch(`/api/sync?code=${encodeURIComponent(code)}`);
      const d = await res.json();
      if (res.ok && d.found) {
        applySnapshot(d.data);
        setSyncMsg("✓ Pulled and applied.");
      } else if (res.ok) {
        setSyncMsg("No data found for that code.");
      } else {
        setSyncMsg(d.error || "Failed to pull.");
      }
    } catch {
      setSyncMsg("Network error.");
    } finally {
      setSyncBusy(false);
    }
  };

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
          <div className="mt-4">
            <label htmlFor="ainote" className="text-sm font-medium text-white">
              About your taste (optional)
            </label>
            <p className="text-xs text-muted">
              Aurora blends this with what you like &amp; play to personalize recommendations.
            </p>
            <textarea
              id="ainote"
              value={aiNote}
              onChange={(e) => setAiNote(e.target.value)}
              rows={2}
              maxLength={400}
              placeholder="e.g. I love ambient & jazz, sci-fi films, and I follow Argentine football."
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-accent/60 focus:outline-none"
            />
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

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
            <div>
              <p className="text-sm font-medium text-white">Auto-DJ (infinite queue)</p>
              <p className="text-xs text-muted">
                When the queue ends, keep playing similar music & video automatically.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={autoDj}
              aria-label="Auto-DJ"
              onClick={() => setAutoDj(!autoDj)}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition",
                autoDj ? "bg-accent" : "bg-white/15",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                  autoDj ? "left-[22px]" : "left-0.5",
                )}
              />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-white">Sleep timer</p>
              <p className="text-xs text-muted">
                {sleepAt
                  ? `Playback pauses in about ${Math.max(1, Math.round((sleepAt - Date.now()) / 60000))} min.`
                  : "Automatically pause after a set time."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["Off", null],
                  ["15m", 15],
                  ["30m", 30],
                  ["60m", 60],
                ] as [string, number | null][]
              ).map(([label, mins]) => {
                const active = mins == null ? !sleepAt : false;
                return (
                  <button
                    key={label}
                    onClick={() => setSleepTimer(mins)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium transition",
                      active ? "bg-white text-black" : "bg-white/5 text-muted hover:text-white",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        <Section title="Notifications" desc="Reminders while Aurora is open in a tab.">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Routine reminders</p>
              <p className="text-xs text-muted">
                Get a desktop notification when a scheduled routine starts. Background firing while
                fully closed needs a server + push (deploy-time).
              </p>
            </div>
            <button
              role="switch"
              aria-checked={notifyRoutines}
              aria-label="Routine reminders"
              onClick={toggleNotify}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition",
                notifyRoutines ? "bg-accent" : "bg-white/15",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                  notifyRoutines ? "left-[22px]" : "left-0.5",
                )}
              />
            </button>
          </div>
        </Section>

        <Section title="Live TV" desc="If many channels fail to play, try routing them through the proxy.">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Force proxy for live TV</p>
              <p className="text-xs text-muted">
                Routes every channel through Aurora&apos;s stream proxy — fixes many CORS-blocked
                channels (uses more bandwidth; geo-blocked streams still won&apos;t play).
              </p>
            </div>
            <button
              role="switch"
              aria-checked={forceProxyTv}
              aria-label="Force proxy for live TV"
              onClick={() => setForceProxyTv(!forceProxyTv)}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition",
                forceProxyTv ? "bg-accent" : "bg-white/15",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                  forceProxyTv ? "left-[22px]" : "left-0.5",
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

        <Section
          title="Sync across devices"
          desc="Push this device's library, settings & routines to a private code, then pull it on another device."
        >
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={syncCode}
              onChange={(e) => setSyncCode(e.target.value)}
              placeholder="your-private-code"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-accent/60 focus:outline-none"
            />
            <button
              onClick={() => setSyncCode(Math.random().toString(36).slice(2, 10))}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Generate
            </button>
            <button
              onClick={pushSync}
              disabled={syncBusy}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <UploadCloud className="h-4 w-4" /> Push
            </button>
            <button
              onClick={pullSync}
              disabled={syncBusy}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              <DownloadCloud className="h-4 w-4" /> Pull
            </button>
          </div>
          {syncMsg && <p className="mt-2 text-xs text-muted">{syncMsg}</p>}
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
