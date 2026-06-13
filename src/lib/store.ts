"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { MediaItem } from "./types";

export type RepeatMode = "off" | "all" | "one";

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface PlayerState {
  // Reactive playback state
  current: MediaItem | null;
  queue: MediaItem[];
  /** Insertion order, used to restore when shuffle is turned off. */
  originalQueue: MediaItem[];
  index: number;
  isPlaying: boolean;
  volume: number; // 0..1
  muted: boolean;
  progress: number; // seconds
  duration: number; // seconds (Infinity for live)
  buffered: number;
  loading: boolean;
  error: string | null;
  expanded: boolean; // video theater overlay
  seekTo: number | null; // imperative seek request consumed by PlayerHost
  shuffle: boolean;
  repeat: RepeatMode;

  // Persisted personalization
  recents: MediaItem[];
  favorites: MediaItem[];
  /** Resume positions (seconds) for on-demand video, keyed by item id. */
  progressById: Record<string, number>;

  // Intent actions (UI -> store)
  play: (item: MediaItem, queue?: MediaItem[]) => void;
  toggle: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  /** Auto-advance when a track ends — respects repeat mode. */
  ended: () => void;
  jumpTo: (i: number) => void;
  removeAt: (i: number) => void;
  clearQueue: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  seek: (t: number) => void;
  setExpanded: (e: boolean) => void;
  stop: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleFavorite: (item: MediaItem) => void;

  // Engine sync (PlayerHost -> store)
  _setPlaying: (p: boolean) => void;
  _setProgress: (t: number) => void;
  _setDuration: (d: number) => void;
  _setBuffered: (b: number) => void;
  _setLoading: (l: boolean) => void;
  _setError: (e: string | null) => void;
  _clearSeek: () => void;
  _saveProgress: (id: string, time: number, duration: number) => void;
}

const MAX_RECENTS = 30;
const MAX_FAVORITES = 300;

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => {
      // Advance to a given queue index and start playing it.
      const apply = (i: number) => {
        const { queue } = get();
        const item = queue[i];
        if (!item) return;
        set({
          index: i,
          current: item,
          isPlaying: true,
          progress: 0,
          duration: 0,
          buffered: 0,
          loading: true,
          error: null,
          expanded: item.kind === "video" ? get().expanded : false,
        });
      };

      return {
        current: null,
        queue: [],
        originalQueue: [],
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
        shuffle: false,
        repeat: "off",
        recents: [],
        favorites: [],
        progressById: {},

        play: (item, queue) => {
          const base = queue && queue.length ? queue : [item];
          const original = base.slice();
          let q = base;
          let idx = Math.max(0, base.findIndex((m) => m.id === item.id));
          if (get().shuffle) {
            q = [item, ...shuffled(base.filter((m) => m.id !== item.id))];
            idx = 0;
          }
          const recents = [item, ...get().recents.filter((r) => r.id !== item.id)].slice(
            0,
            MAX_RECENTS,
          );
          set({
            current: item,
            queue: q,
            originalQueue: original,
            index: idx,
            isPlaying: true,
            progress: 0,
            duration: 0,
            buffered: 0,
            loading: true,
            error: null,
            recents,
            expanded: item.kind === "video",
          });
        },

        toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
        pause: () => set({ isPlaying: false }),
        resume: () => set({ isPlaying: true }),

        next: () => {
          const { queue, index } = get();
          if (!queue.length) return;
          apply(index < queue.length - 1 ? index + 1 : 0);
        },

        prev: () => {
          const { queue, index, progress } = get();
          if (!queue.length) return;
          if (progress > 3) {
            set({ seekTo: 0, progress: 0 });
            return;
          }
          apply(index > 0 ? index - 1 : queue.length - 1);
        },

        ended: () => {
          const { repeat, index, queue } = get();
          if (repeat === "one") {
            set({ seekTo: 0, progress: 0, isPlaying: true });
            return;
          }
          if (index < queue.length - 1) {
            apply(index + 1);
            return;
          }
          if (repeat === "all") {
            apply(0);
            return;
          }
          set({ isPlaying: false });
        },

        jumpTo: (i) => apply(i),

        removeAt: (i) => {
          const { queue, index, originalQueue } = get();
          if (i === index || !queue[i]) return; // don't remove the playing track
          const removed = queue[i];
          set({
            queue: queue.filter((_, k) => k !== i),
            index: i < index ? index - 1 : index,
            originalQueue: originalQueue.filter((m) => m.id !== removed.id),
          });
        },

        clearQueue: () => {
          const { current } = get();
          set({ queue: current ? [current] : [], originalQueue: current ? [current] : [], index: 0 });
        },

        setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)), muted: v === 0 }),
        toggleMute: () => set((s) => ({ muted: !s.muted })),
        seek: (t) => set({ seekTo: t, progress: t }),
        setExpanded: (e) => set({ expanded: e }),
        stop: () =>
          set({ current: null, isPlaying: false, progress: 0, duration: 0, expanded: false }),

        toggleShuffle: () => {
          const { shuffle, queue, originalQueue, current, index } = get();
          if (!shuffle) {
            const rest = queue.filter((_, i) => i !== index);
            set({
              shuffle: true,
              originalQueue: originalQueue.length ? originalQueue : queue.slice(),
              queue: current ? [current, ...shuffled(rest)] : shuffled(rest),
              index: 0,
            });
          } else {
            const orig = originalQueue.length ? originalQueue : queue;
            const ni = current ? Math.max(0, orig.findIndex((m) => m.id === current.id)) : 0;
            set({ shuffle: false, queue: orig, index: ni, originalQueue: [] });
          }
        },

        cycleRepeat: () =>
          set((s) => ({ repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off" })),

        toggleFavorite: (item) => {
          const fav = get().favorites;
          const exists = fav.some((f) => f.id === item.id);
          set({
            favorites: exists
              ? fav.filter((f) => f.id !== item.id)
              : [item, ...fav].slice(0, MAX_FAVORITES),
          });
        },

        _setPlaying: (p) => set({ isPlaying: p }),
        _setProgress: (t) => set({ progress: t }),
        _setDuration: (d) => set({ duration: d }),
        _setBuffered: (b) => set({ buffered: b }),
        _setLoading: (l) => set({ loading: l }),
        _setError: (e) => set({ error: e, loading: false }),
        _clearSeek: () => set({ seekTo: null }),
        _saveProgress: (id, time, duration) => {
          const p = { ...get().progressById };
          if (isFinite(duration) && duration > 0 && time > 5 && time < duration * 0.95) {
            p[id] = time;
          } else {
            delete p[id];
          }
          set({ progressById: p });
        },
      };
    },
    {
      name: "aurora-player",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        volume: s.volume,
        muted: s.muted,
        recents: s.recents,
        favorites: s.favorites,
        progressById: s.progressById,
        shuffle: s.shuffle,
        repeat: s.repeat,
      }),
    },
  ),
);
