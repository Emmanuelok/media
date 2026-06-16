"use client";

import { create } from "zustand";

interface UIState {
  conciergeOpen: boolean;
  conciergeSeed: string | null;
  /** When true, the concierge auto-sends the seed in Auto-pilot mode. */
  conciergeAutoRun: boolean;
  /** Bumped each auto-run so the same routine can be re-triggered. */
  conciergeRunId: number;
  openConcierge: (seed?: string, autoRun?: boolean) => void;
  closeConcierge: () => void;

  queueOpen: boolean;
  toggleQueue: () => void;
  closeQueue: () => void;
}

/** Lightweight global UI state (AI Concierge panel + Up-Next queue panel). */
export const useUI = create<UIState>((set) => ({
  conciergeOpen: false,
  conciergeSeed: null,
  conciergeAutoRun: false,
  conciergeRunId: 0,
  openConcierge: (seed, autoRun = false) =>
    set((s) => ({
      conciergeOpen: true,
      conciergeSeed: seed ?? null,
      conciergeAutoRun: autoRun,
      conciergeRunId: autoRun ? s.conciergeRunId + 1 : s.conciergeRunId,
    })),
  closeConcierge: () => set({ conciergeOpen: false }),

  queueOpen: false,
  toggleQueue: () => set((s) => ({ queueOpen: !s.queueOpen })),
  closeQueue: () => set({ queueOpen: false }),
}));
