"use client";

import { usePlayer } from "./store";
import { useSettings } from "./settings";
import { useRoutines } from "./routines-store";

// A portable snapshot of the user's library, preferences, and routines for
// code-based cross-device sync (last-write-wins).

export function buildSnapshot() {
  const p = usePlayer.getState();
  const s = useSettings.getState();
  const r = useRoutines.getState();
  return {
    v: 1 as const,
    player: {
      favorites: p.favorites,
      recents: p.recents,
      progressById: p.progressById,
      volume: p.volume,
      muted: p.muted,
      shuffle: p.shuffle,
      repeat: p.repeat,
      autoplay: p.autoplay,
      autoDj: p.autoDj,
    },
    settings: { aiModel: s.aiModel, accent: s.accent, aiNote: s.aiNote },
    routines: { custom: r.custom, schedules: r.schedules },
  };
}

export type SyncSnapshot = ReturnType<typeof buildSnapshot>;

export function applySnapshot(snap: SyncSnapshot | null | undefined) {
  if (!snap || typeof snap !== "object") return;
  if (snap.player) usePlayer.setState(snap.player);
  if (snap.settings) useSettings.setState(snap.settings);
  if (snap.routines) useRoutines.setState(snap.routines);
}
