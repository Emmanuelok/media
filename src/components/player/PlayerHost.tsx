"use client";

import { useEffect, useRef } from "react";
import type HlsType from "hls.js";
import { usePlayer } from "@/lib/store";
import { isHls } from "@/lib/utils";
import { proxiedUrl, needsProxy } from "@/lib/stream";
import NowPlayingBar from "./NowPlayingBar";
import FloatingVideo from "./FloatingVideo";

/**
 * The single media engine for the whole app. It owns one <audio> and one <video>
 * element that live here permanently, so navigating between pages never interrupts
 * playback. HLS streams are wired through hls.js (with native fallback on Safari).
 */
export default function PlayerHost() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const originalSrcRef = useRef<string>("");
  const proxyTriedRef = useRef(false);

  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const seekTo = usePlayer((s) => s.seekTo);

  const isVideo = !!current && (current.kind === "video" || current.kind === "tv");

  // Wire media element events -> store, once, for both elements.
  useEffect(() => {
    const els = [audioRef.current, videoRef.current].filter(Boolean) as HTMLMediaElement[];
    const S = usePlayer.getState;
    const onTime = (e: Event) => {
      const el = e.currentTarget as HTMLMediaElement;
      S()._setProgress(el.currentTime);
      const b = el.buffered;
      if (b.length) S()._setBuffered(b.end(b.length - 1));
    };
    const onMeta = (e: Event) => S()._setDuration((e.currentTarget as HTMLMediaElement).duration);
    const onPlay = () => S()._setPlaying(true);
    const onPause = () => S()._setPlaying(false);
    const onWaiting = () => S()._setLoading(true);
    const onPlaying = () => S()._setLoading(false);
    const onEnded = () => S().next();
    const onErr = () => {
      // HLS errors (incl. proxy fallback) are handled by the hls.js error handler.
      if (hlsRef.current) return;
      S()._setError("Playback failed — this source may be offline, geo-blocked, or HTTP-only.");
    };

    els.forEach((el) => {
      el.addEventListener("timeupdate", onTime);
      el.addEventListener("durationchange", onMeta);
      el.addEventListener("loadedmetadata", onMeta);
      el.addEventListener("play", onPlay);
      el.addEventListener("pause", onPause);
      el.addEventListener("waiting", onWaiting);
      el.addEventListener("playing", onPlaying);
      el.addEventListener("ended", onEnded);
      el.addEventListener("error", onErr);
    });
    return () =>
      els.forEach((el) => {
        el.removeEventListener("timeupdate", onTime);
        el.removeEventListener("durationchange", onMeta);
        el.removeEventListener("loadedmetadata", onMeta);
        el.removeEventListener("play", onPlay);
        el.removeEventListener("pause", onPause);
        el.removeEventListener("waiting", onWaiting);
        el.removeEventListener("playing", onPlaying);
        el.removeEventListener("ended", onEnded);
        el.removeEventListener("error", onErr);
      });
  }, []);

  // Load the source whenever the current item changes.
  useEffect(() => {
    const item = current;
    const el = isVideo ? videoRef.current : audioRef.current;
    const other = isVideo ? audioRef.current : videoRef.current;
    if (other) {
      try {
        other.pause();
        other.removeAttribute("src");
      } catch {
        /* noop */
      }
    }
    if (!el || !item) return;

    let cancelled = false;
    proxyTriedRef.current = false;
    originalSrcRef.current = item.src;
    usePlayer.getState()._setLoading(true);
    usePlayer.getState()._setError(null);

    const wantsHls = item.streamType === "hls" || isHls(item.src);
    const native = !!el.canPlayType("application/vnd.apple.mpegurl");

    const start = async (src: string) => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      const viaProxy = src.startsWith("/api/stream");

      if (wantsHls && !native) {
        const { default: Hls } = await import("hls.js");
        if (cancelled) return;
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 60 });
          hlsRef.current = hls;
          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (!data.fatal) return;
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              // Likely CORS/mixed-content on a direct stream — retry once via our proxy.
              if (!viaProxy && !proxyTriedRef.current) {
                proxyTriedRef.current = true;
                start(proxiedUrl(originalSrcRef.current));
              } else {
                usePlayer
                  .getState()
                  ._setError("This live stream is offline, geo-blocked, or unreachable.");
              }
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              usePlayer.getState()._setError("This live stream could not be played.");
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

      el.volume = muted ? 0 : volume;
      if (usePlayer.getState().isPlaying) {
        try {
          await el.play();
        } catch {
          /* autoplay may be blocked until user gesture */
        }
      }
    };

    // HTTP origins must start proxied (mixed-content); HTTPS starts direct, proxy on failure.
    start(needsProxy(item.src) ? proxiedUrl(item.src) : item.src);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

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

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} preload="auto" />
      <FloatingVideo videoRef={videoRef} visible={isVideo} />
      {current && !isVideo && <NowPlayingBar />}
    </>
  );
}
