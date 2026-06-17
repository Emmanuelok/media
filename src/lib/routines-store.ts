"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Routine, Schedule } from "./routines";

interface RoutinesState {
  custom: Routine[];
  schedules: Schedule[];
  add: (r: Omit<Routine, "id">) => void;
  remove: (id: string) => void;
  addSchedule: (s: { label: string; prompt: string; time: string }) => void;
  removeSchedule: (id: string) => void;
  toggleSchedule: (id: string) => void;
  markFired: (id: string, dateKey: string) => void;
}

/** User-defined routines + scheduled routines, persisted in the browser. */
export const useRoutines = create<RoutinesState>()(
  persist(
    (set, get) => ({
      custom: [],
      schedules: [],
      add: (r) => set({ custom: [{ ...r, id: `custom-${Date.now()}` }, ...get().custom].slice(0, 50) }),
      remove: (id) => set({ custom: get().custom.filter((c) => c.id !== id) }),
      addSchedule: (s) =>
        set({
          schedules: [
            { ...s, id: `sch-${Date.now()}`, enabled: true, lastFired: null },
            ...get().schedules,
          ].slice(0, 50),
        }),
      removeSchedule: (id) => set({ schedules: get().schedules.filter((s) => s.id !== id) }),
      toggleSchedule: (id) =>
        set({
          schedules: get().schedules.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
        }),
      markFired: (id, dateKey) =>
        set({ schedules: get().schedules.map((s) => (s.id === id ? { ...s, lastFired: dateKey } : s)) }),
    }),
    { name: "aurora-routines", storage: createJSONStorage(() => localStorage) },
  ),
);
