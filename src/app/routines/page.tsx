"use client";

import { useState } from "react";
import { Wand2, Play, Plus, Trash2, Clock } from "lucide-react";
import { DEFAULT_ROUTINES, type Routine } from "@/lib/routines";
import { useRoutines } from "@/lib/routines-store";
import { useUI } from "@/lib/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";

export default function RoutinesPage() {
  const custom = useRoutines((s) => s.custom);
  const add = useRoutines((s) => s.add);
  const remove = useRoutines((s) => s.remove);
  const schedules = useRoutines((s) => s.schedules);
  const addSchedule = useRoutines((s) => s.addSchedule);
  const removeSchedule = useRoutines((s) => s.removeSchedule);
  const toggleSchedule = useRoutines((s) => s.toggleSchedule);
  const openConcierge = useUI((s) => s.openConcierge);

  const allRoutines = [...DEFAULT_ROUTINES, ...custom];
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [schedSel, setSchedSel] = useState(DEFAULT_ROUTINES[0].id);
  const [schedTime, setSchedTime] = useState("08:00");

  const submitSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const r = allRoutines.find((x) => x.id === schedSel);
    if (!r || !schedTime) return;
    addSchedule({ label: r.title, prompt: r.prompt, time: schedTime });
  };

  const run = (p: string) => openConcierge(p, true);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prompt.trim()) return;
    add({ title: title.trim(), emoji: "⭐", prompt: prompt.trim(), description: "Custom routine" });
    setTitle("");
    setPrompt("");
  };

  const Card = ({ r, deletable }: { r: Routine; deletable: boolean }) => (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-surface/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl">{r.emoji}</span>
        {deletable && (
          <button
            onClick={() => remove(r.id)}
            aria-label="Delete routine"
            className="rounded-full p-1.5 text-muted transition hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mt-2 font-semibold text-white">{r.title}</p>
      {r.description && <p className="text-xs text-muted">{r.description}</p>}
      <p className="mt-2 line-clamp-2 text-xs italic text-muted/80">“{r.prompt}”</p>
      <button
        onClick={() => run(r.prompt)}
        className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        <Play className="h-4 w-4" fill="currentColor" /> Run
      </button>
    </div>
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        icon={Wand2}
        title="Routines"
        subtitle="One tap and Aurora sets the whole scene — powered by the autonomous AI agent"
        accent="bg-gradient-to-br from-violet-500 to-indigo-600"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {DEFAULT_ROUTINES.map((r) => (
          <Card key={r.id} r={r} deletable={false} />
        ))}
        {custom.map((r) => (
          <Card key={r.id} r={r} deletable />
        ))}
      </div>

      <section className="mt-8 max-w-xl rounded-2xl border border-white/10 bg-surface/50 p-5">
        <h2 className="text-base font-bold text-white">Create a routine</h2>
        <p className="mt-0.5 text-sm text-muted">
          Describe what Aurora should set up — it runs through the autonomous agent.
        </p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name (e.g. Sunday morning)"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-accent/60 focus:outline-none"
          />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Instruction (e.g. Play upbeat jazz and open a live news channel)"
            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-accent/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!title.trim() || !prompt.trim()}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.03] disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Add routine
          </button>
        </form>
      </section>

      <section className="mt-6 max-w-xl rounded-2xl border border-white/10 bg-surface/50 p-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-white">
          <Clock className="h-4 w-4 text-accent" /> Scheduled routines
        </h2>
        <p className="mt-0.5 text-sm text-muted">
          Auto-run a routine at a set time. It fires while Aurora is open in a tab — web apps
          can&apos;t run in the background.
        </p>
        <form onSubmit={submitSchedule} className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={schedSel}
            onChange={(e) => setSchedSel(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-accent/60 focus:outline-none"
          >
            {allRoutines.map((r) => (
              <option key={r.id} value={r.id}>
                {r.emoji} {r.title}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={schedTime}
            onChange={(e) => setSchedTime(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-accent/60 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.03]"
          >
            <Plus className="h-4 w-4" /> Schedule
          </button>
        </form>

        {schedules.length > 0 && (
          <ul className="mt-4 space-y-2">
            {schedules.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {s.time} · {s.label}
                  </p>
                  <p className="truncate text-xs text-muted">{s.prompt}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => toggleSchedule(s.id)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium transition",
                      s.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-muted",
                    )}
                  >
                    {s.enabled ? "On" : "Off"}
                  </button>
                  <button
                    onClick={() => removeSchedule(s.id)}
                    aria-label="Delete schedule"
                    className="rounded-full p-1.5 text-muted transition hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
