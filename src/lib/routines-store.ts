"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Routine } from "./routines";

interface RoutinesState {
  custom: Routine[];
  add: (r: Omit<Routine, "id">) => void;
  remove: (id: string) => void;
}

/** User-defined routines, persisted in the browser. */
export const useRoutines = create<RoutinesState>()(
  persist(
    (set, get) => ({
      custom: [],
      add: (r) => set({ custom: [{ ...r, id: `custom-${Date.now()}` }, ...get().custom].slice(0, 50) }),
      remove: (id) => set({ custom: get().custom.filter((c) => c.id !== id) }),
    }),
    { name: "aurora-routines", storage: createJSONStorage(() => localStorage) },
  ),
);
