"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Selectable Claude models for the AI concierge. The /api/stream route keeps its
// own copy of these ids as a server-side allowlist (clients can't request others).
export const AI_MODELS = [
  { id: "claude-opus-4-8", label: "Opus 4.8", hint: "Most capable" },
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6", hint: "Balanced speed" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5", hint: "Fastest" },
  { id: "claude-fable-5", label: "Fable 5", hint: "Frontier" },
] as const;

export type AiModelId = (typeof AI_MODELS)[number]["id"];

export const ACCENTS = [
  { id: "violet", value: "#a855f7" },
  { id: "fuchsia", value: "#d946ef" },
  { id: "cyan", value: "#06b6d4" },
  { id: "emerald", value: "#10b981" },
  { id: "rose", value: "#f43f5e" },
  { id: "amber", value: "#f59e0b" },
] as const;

interface SettingsState {
  aiModel: AiModelId;
  accent: string;
  aiNote: string;
  setAiModel: (m: AiModelId) => void;
  setAccent: (a: string) => void;
  setAiNote: (n: string) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      aiModel: "claude-opus-4-8",
      accent: "#a855f7",
      aiNote: "",
      setAiModel: (m) => set({ aiModel: m }),
      setAccent: (a) => set({ accent: a }),
      setAiNote: (n) => set({ aiNote: n.slice(0, 400) }),
    }),
    { name: "aurora-settings", storage: createJSONStorage(() => localStorage) },
  ),
);
