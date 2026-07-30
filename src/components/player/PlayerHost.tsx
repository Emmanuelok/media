"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type HlsType from "hls.js";
import { usePlayer } from "@/lib/store";
import { isHls } from "@/lib/utils";
import { initialPlaybackUrl, proxyFallbackUrl } from "@/lib/stream";
import { useSettings } from "@/lib/settings";
import NowPlayingBar from "./NowPlayingBar";
import FloatingVideo from "./FloatingVideo";
import QueuePanel from "./QueuePanel";

/**
 * The single media engine for the whole app. It owns one <audio> and one <video>
 * element that live here permanently, so navigating between pages never interrupts
 * playback. HLS streams run through hls.js (native fallback on Safari) with an
 * automatic /api/stream proxy fallback. Also wires resume positions, OS-level
 * Media Session controls, and keyboard shortcuts.
 */
export default function PlayerHost() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const originalSrcRef = useRef<string>("");
  const proxyTriedRef = useRef(false);
  const mediaRecoveriesRef = useRef(0);
  const loadFailedRef = useRef(false);
  const activeElementRef = useRef<HTMLMediaElement | null>(null);
  const nativeErrorHandlerRef = useRef<((el: HTMLMediaElement) => void) | null>(null);
  const pendingResumeRef = useRef(0);
  const lastSaveRef = useRef(0);
  const [reloadToken, setReloadToken] = useState(0);

  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const seekTo = usePlayer((s) => s.seekTo);
  const sleepAt = usePlayer((s) => s.sleepAt);
  const levelRequest = usePlayer((s) => s.levelRequest);

  const isVideo = !!current && (current.kind === "video" || current.kind === "tv");

  const retryCurrent = useCallback(() => {
    const S = usePlayer.getState();
    if (!S.current) return;
    S._setError(null);
    S._setLoading(true);
    S.resume();
    setReloadToken((token) => token + 1);
  }, []);

  // Wire media element events -> store, once, for both elements.
  useEffect(() => {
    const els = [audioRef.current, videoRef.current].filter(Boolean) as HTMLMediaElement[];
    const S = usePlayer.getState;

    const onTime = (e: Event) => {
      const el = e.currentTarget as HTMLMediaElement;
      S()._setProgress(el.currentTime);
      const b = el.buffered;
      if (b.length) S()._setBuffered(b.end(b.length - 1));

      const c = S().current;
      if (c && el === videoRef.current && c.kind === "video") {
        const now = Date.now();
        if (now - lastSaveRef.current > 4000) {
          lastSaveRef.current = now;
          S()._saveProgress(c.id, el.currentTime, el.duration);
        }
      }
      if ("mediaSession" in navigator && isFinite(el.duration) && el.duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: el.duration,
            position: Math.min(el.currentTime, el.duration),
            playbackRate: el.playbackRate || 1,
          });
        } catch {
          /* some browsers reject odd values */
        }
      }
    };
    const onMeta = (e: Event) => {
      const el = e.currentTarget as HTMLMediaElement;
      S()._setDuration(el.duration);
      if (el === videoRef.current && pendingResumeRef.current > 0 && isFinite(el.duration)) {
        try {
          el.currentTime = pendingResumeRef.current;
        } catch {
          /* noop */
        }
        pendingResumeRef.current = 0;
      }
    };
    const onPlay = () => S()._setPlaying(true);
    const onPause = (e: Event) => {
      S()._setPlaying(false);
      const el = e.currentTarget as HTMLMediaElement;
      const c = S().current;
      if (c && el === videoRef.current && c.kind === "video") {
        S()._saveProgress(c.id, el.currentTime, el.duration);
      }
    };
    const onWaiting = () => {
      const state = S();
      if (!state.error) state._setLoading(true);
    };
    const onPlaying = () => S()._setError(null);
    const onEnded = () => S().ended();
    const onErr = (e: Event) => {
      const el = e.currentTarget as HTMLMediaElement;
      if (el !== activeElementRef.current) return;
      if (hlsRef.current) return; // HLS errors handled by the hls.js handler (with proxy fallback)
      const handler = nativeErrorHandlerRef.current;
      if (handler) handler(el);
      else S()._setError("Playback failed — this source may be offline or unavailable.");
    };

    const handlers: [string, EventListener][] = [
      ["timeupdate", onTime],
      ["durationchange", onMeta],
      ["loadedmetadata", onMeta],
      ["play", onPlay],
      ["pause", onPause],
      ["waiting", onWaiting],
      ["playing", onPlaying],
      ["ended", onEnded],
      ["error", onErr],
    ];
    els.forEach((el) => handlers.forEach(([ev, fn]) => el.addEventListener(ev, fn)));
    return () => els.forEach((el) => handlers.forEach(([ev, fn]) => el.removeEventListener(ev, fn)));
  }, []);

  // Load the source whenever the current item changes (with proxy fallback).
  useEffect(() => {
    const item = current;
    const el = isVideo ? videoRef.current : audioRef.current;
    const other = isVideo ? audioRef.current : videoRef.current;
    activeElementRef.current = el;
    if (other) {
      try {
        other.pause();
        other.removeAttribute("src");
      } catch {
        /* noop */
      }
    }
    if (!el || !item) {
      nativeErrorHandlerRef.current = null;
      activeElementRef.current = null;
      return;
    }

    let cancelled = false;
    let activeSrc = "";
    proxyTriedRef.current = false;
    mediaRecoveriesRef.current = 0;
    loadFailedRef.current = false;
    originalSrcRef.current = item.src;
    pendingResumeRef.current = item.kind === "video" ? usePlayer.getState().progressById[item.id] || 0 : 0;
    usePlayer.getState()._setLoading(true);
    usePlayer.getState()._setError(null);

    const wantsHls = item.streamType === "hls" || isHls(item.src);
    const native = !!el.canPlayType("application/vnd.apple.mpegurl");

    const fail = (message: string) => {
      if (cancelled || loadFailedRef.current) return;
      loadFailedRef.current = true;
      try {
        el.pause();
      } catch {
        /* noop */
      }
      const S = usePlayer.getState();
      S._setPlaying(false);
      S._setError(message);
    };

    const start = async (src: string) => {
      if (cancelled) return;
      activeSrc = src;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      const viaProxy = src.startsWith("/api/stream");

      if (wantsHls && !native) {
        const { default: Hls } = await import("hls.js");
        if (cancelled) return;
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            capLevelToPlayerSize: false, // don't cap quality to the small player
            abrEwmaDefaultEstimate: 1_500_000, // start at a higher bitrate, not the lowest
            maxBufferLength: 30,
            backBufferLength: 90,
          });
          hlsRef.current = hls;
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (cancelled || hlsRef.current !== hls) return;
            usePlayer
              .getState()
              ._setQualities(
                hls.levels.map((l, i) => ({ index: i, height: l.height || 0, bitrate: l.bitrate || 0 })),
              );
          });
          hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
            if (cancelled || hlsRef.current !== hls) return;
            usePlayer.getState()._setCurrentQuality(data.level);
          });
          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (!data.fatal || cancelled || hlsRef.current !== hls || loadFailedRef.current) return;
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              const fallback = proxyFallbackUrl(
                originalSrcRef.current,
                src,
                proxyTriedRef.current,
              );
              if (!viaProxy && fallback) {
                proxyTriedRef.current = true;
                usePlayer.getState()._setLoading(true);
                launch(fallback);
              } else {
                fail("This live stream is offline, geo-blocked, or unreachable.");
              }
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              if (mediaRecoveriesRef.current < 1) {
                mediaRecoveriesRef.current += 1;
                usePlayer.getState()._setLoading(true);
                try {
                  hls.recoverMediaError();
                } catch {
                  fail("This live stream could not recover. Retry it or skip to another source.");
                }
              } else {
                fail("This live stream could not recover. Retry it or skip to another source.");
              }
            } else {
              fail("This live stream could not be played. Retry it or skip to another source.");
            }
          });
          hls.loadSource(src);
          hls.attachMedia(el);
        } else {
          el.src = src;
          el.load();
        }
      } else {
        el.src = src;
        el.load();
      }

      const state = usePlayer.getState();
      el.volume = state.muted ? 0 : state.volume;
      if (state.isPlaying) {
        try {
          await el.play();
        } catch {
          /* autoplay may be blocked until a user gesture */
        }
      }
    };

    const launch = (src: string) => {
      void start(src).catch(() => {
        fail(
          item.kind === "radio"
            ? "This radio stream could not be loaded. Retry it or skip to another station."
            : "Playback could not be loaded. Retry it or skip to another source.",
        );
      });
    };

    const handleNativeError = (failedEl: HTMLMediaElement) => {
      if (cancelled || failedEl !== el || loadFailedRef.current) return;
      const fallback = wantsHls
        ? proxyFallbackUrl(originalSrcRef.current, activeSrc, proxyTriedRef.current)
        : null;
      if (fallback) {
        proxyTriedRef.current = true;
        usePlayer.getState()._setError(null);
        usePlayer.getState()._setLoading(true);
        launch(fallback);
        return;
      }
      fail(
        item.kind === "radio"
          ? "This radio station is offline or unreachable. Retry it or skip to another station."
          : "Playback failed — this source may be offline, geo-blocked, or unavailable.",
      );
    };
    nativeErrorHandlerRef.current = handleNativeError;

    // HTTP origins must start proxied; "Force proxy for live TV" routes TV through it too (beats CORS).
    const forceProxy = item.kind === "tv" && wantsHls && useSettings.getState().forceProxyTv;
    launch(initialPlaybackUrl(item.src, forceProxy));

    return () => {
      cancelled = true;
      if (nativeErrorHandlerRef.current === handleNativeError) nativeErrorHandlerRef.current = null;
      if (activeElementRef.current === el) activeElementRef.current = null;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, current?.src, current?.kind, current?.streamType, reloadToken]);

  // Reflect play/pause intent.
  useEffect(() => {
    const el = isVideo ? videoRef.current : audioRef.current;
    if (!el) return;
    if (isPlaying) el.play().catch(() => {});
    else el.pause();
  }, [isPlaying, isVideo]);

  // Reflect volume.
  useEffect(() => {
    const vol = muted ? 0 : volume;
    if (audioRef.current) audioRef.current.volume = vol;
    if (videoRef.current) videoRef.current.volume = vol;
  }, [volume, muted]);

  // Perform requested seeks.
  useEffect(() => {
    if (seekTo == null) return;
    const el = isVideo ? videoRef.current : audioRef.current;
    if (el) {
      try {
        el.currentTime = seekTo;
      } catch {
        /* noop */
      }
    }
    usePlayer.getState()._clearSeek();
  }, [seekTo, isVideo]);

  // Sleep timer — auto-pause when the scheduled time arrives.
  useEffect(() => {
    if (sleepAt == null) return;
    const fire = () => {
      usePlayer.getState().pause();
      usePlayer.getState().setSleepTimer(null);
    };
    const ms = sleepAt - Date.now();
    if (ms <= 0) {
      fire();
      return;
    }
    const t = setTimeout(fire, ms);
    return () => clearTimeout(t);
  }, [sleepAt]);

  // Apply a chosen HLS quality level (-1 = auto / ABR).
  useEffect(() => {
    if (levelRequest == null) return;
    if (hlsRef.current) {
      try {
        hlsRef.current.currentLevel = levelRequest;
      } catch {
        /* level may be unavailable */
      }
    }
    usePlayer.getState()._clearLevelRequest();
  }, [levelRequest]);

  // Media Session — OS-level metadata + lock-screen / hardware-key controls.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    if (!current) {
      navigator.mediaSession.metadata = null;
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.subtitle || "Aurora",
      album: "Aurora Media House",
      artwork: current.thumbnail ? [{ src: current.thumbnail, sizes: "512x512" }] : [],
    });
  }, [current]);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = current ? (isPlaying ? "playing" : "paused") : "none";
    }
  }, [isPlaying, current]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const S = usePlayer.getState;
    const bind = (a: MediaSessionAction, h: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(a, h);
      } catch {
        /* unsupported action */
      }
    };
    bind("play", () => S().resume());
    bind("pause", () => S().pause());
    bind("previoustrack", () => S().prev());
    bind("nexttrack", () => S().next());
    bind("seekbackward", (d) => S().seek(Math.max(0, S().progress - (d.seekOffset || 10))));
    bind("seekforward", (d) => S().seek(S().progress + (d.seekOffset || 10)));
    bind("seekto", (d) => d.seekTime != null && S().seek(d.seekTime));
    bind("stop", () => S().stop());
    return () =>
      (["play", "pause", "previoustrack", "nexttrack", "seekbackward", "seekforward", "seekto", "stop"] as MediaSessionAction[]).forEach(
        (a) => bind(a, null),
      );
  }, []);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable))
        return;
      const S = usePlayer.getState();
      if (!S.current) return;
      switch (e.code) {
        case "Space":
          e.preventDefault();
          S.toggle();
          break;
        case "ArrowRight":
          e.preventDefault();
          S.seek(S.progress + 10);
          break;
        case "ArrowLeft":
          e.preventDefault();
          S.seek(Math.max(0, S.progress - 10));
          break;
        case "ArrowUp":
          e.preventDefault();
          S.setVolume(Math.min(1, S.volume + 0.05));
          break;
        case "ArrowDown":
          e.preventDefault();
          S.setVolume(Math.max(0, S.volume - 0.05));
          break;
        case "KeyM":
          S.toggleMute();
          break;
        case "KeyN":
          S.next();
          break;
        case "KeyP":
          S.prev();
          break;
        case "KeyF":
          if (S.current.kind === "video" || S.current.kind === "tv") S.setExpanded(!S.expanded);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <audio ref={audioRef} preload="auto" />
      <FloatingVideo videoRef={videoRef} visible={isVideo} onRetry={retryCurrent} />
      {current && !isVideo && <NowPlayingBar onRetry={retryCurrent} />}
      <QueuePanel />
    </>
  );
}
