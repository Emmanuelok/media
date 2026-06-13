"use client";

import { create } from "zustand";

interface UIState {
  conciergeOpen: boolean;
  conciergeSeed: string | null;
  openConcierge: (seed?: string) => void;
  closeConcierge: () => void;
}

/** Lightweight global UI state (the AI Concierge panel). */
export const useUI = create<UIState>((set) => ({
  conciergeOpen: false,
  conciergeSeed: null,
  openConcierge: (seed) => set({ conciergeOpen: true, conciergeSeed: seed ?? null }),
  closeConcierge: () => set({ conciergeOpen: false }),
}));
