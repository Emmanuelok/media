"use client";

import { create } from "zustand";

interface UIState {
  conciergeOpen: boolean;
  conciergeSeed: string | null;
  openConcierge: (seed?: string) => void;
  closeConcierge: () => void;

  queueOpen: boolean;
  toggleQueue: () => void;
  closeQueue: () => void;
}

/** Lightweight global UI state (AI Concierge panel + Up-Next queue panel). */
export const useUI = create<UIState>((set) => ({
  conciergeOpen: false,
  conciergeSeed: null,
  openConcierge: (seed) => set({ conciergeOpen: true, conciergeSeed: seed ?? null }),
  closeConcierge: () => set({ conciergeOpen: false }),

  queueOpen: false,
  toggleQueue: () => set((s) => ({ queueOpen: !s.queueOpen })),
  closeQueue: () => set({ queueOpen: false }),
}));
