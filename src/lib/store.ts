"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { MediaItem } from "./types";

interface PlayerState {
  // Reactive playback state
  current: MediaItem | null;
  queue: MediaItem[];
  index: number;
  isPlaying: boolean;
  volume: number; // 0..1
  muted: boolean;
  progress: number; // seconds
  duration: number; // seconds (Infinity for live)
  buffered: number; // seconds buffered ahead
  loading: boolean;
  error: string | null;
  /** Video theater / expanded overlay. */
  expanded: boolean;
  /** Set by the bar, consumed by PlayerHost to perform an imperative seek. */
  seekTo: number | null;
  recents: MediaItem[];

  // Intent actions (UI -> store)
  play: (item: MediaItem, queue?: MediaItem[]) => void;
  toggle: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  seek: (t: number) => void;
  setExpanded: (e: boolean) => void;
  stop: () => void;

  // Engine sync (PlayerHost -> store)
  _setPlaying: (p: boolean) => void;
  _setProgress: (t: number) => void;
  _setDuration: (d: number) => void;
  _setBuffered: (b: number) => void;
  _setLoading: (l: boolean) => void;
  _setError: (e: string | null) => void;
  _clearSeek: () => void;
}

const MAX_RECENTS = 24;

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      current: null,
      queue: [],
      index: 0,
      isPlaying: false,
      volume: 0.9,
      muted: false,
      progress: 0,
      duration: 0,
      buffered: 0,
      loading: false,
      error: null,
      expanded: false,
      seekTo: null,
      recents: [],

      play: (item, queue) => {
        const q = queue && queue.length ? queue : [item];
        const idx = Math.max(0, q.findIndex((m) => m.id === item.id));
        const recents = [item, ...get().recents.filter((r) => r.id !== item.id)].slice(
          0,
          MAX_RECENTS,
        );
        set({
          current: item,
          queue: q,
          index: idx === -1 ? 0 : idx,
          isPlaying: true,
          progress: 0,
          duration: 0,
          buffered: 0,
          loading: true,
          error: null,
          recents,
          // Auto-open the theater for video; keep TV in the floating mini-player.
          expanded: item.kind === "video",
        });
      },

      toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
      pause: () => set({ isPlaying: false }),
      resume: () => set({ isPlaying: true }),

      next: () => {
        const { queue, index } = get();
        if (!queue.length) return;
        const ni = (index + 1) % queue.length;
        set({
          index: ni,
          current: queue[ni],
          isPlaying: true,
          progress: 0,
          duration: 0,
          loading: true,
          error: null,
        });
      },

      prev: () => {
        const { queue, index, progress } = get();
        if (!queue.length) return;
        // Restart the track if we're more than 3s in (Spotify behaviour).
        if (progress > 3) {
          set({ seekTo: 0, progress: 0 });
          return;
        }
        const pi = (index - 1 + queue.length) % queue.length;
        set({
          index: pi,
          current: queue[pi],
          isPlaying: true,
          progress: 0,
          duration: 0,
          loading: true,
          error: null,
        });
      },

      setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)), muted: v === 0 }),
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      seek: (t) => set({ seekTo: t, progress: t }),
      setExpanded: (e) => set({ expanded: e }),
      stop: () =>
        set({ current: null, isPlaying: false, progress: 0, duration: 0, expanded: false }),

      _setPlaying: (p) => set({ isPlaying: p }),
      _setProgress: (t) => set({ progress: t }),
      _setDuration: (d) => set({ duration: d }),
      _setBuffered: (b) => set({ buffered: b }),
      _setLoading: (l) => set({ loading: l }),
      _setError: (e) => set({ error: e, loading: false }),
      _clearSeek: () => set({ seekTo: null }),
    }),
    {
      name: "aurora-player",
      storage: createJSONStorage(() => localStorage),
      // Only persist preferences & history — never live playback state.
      partialize: (s) => ({ volume: s.volume, muted: s.muted, recents: s.recents }),
    },
  ),
);
