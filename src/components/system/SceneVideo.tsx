"use client";

import { useSyncExternalStore } from "react";

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
    addEventListener?: (type: "change", listener: () => void) => void;
    removeEventListener?: (type: "change", listener: () => void) => void;
  };
};

function getReducedDataSnapshot() {
  if (typeof window === "undefined") return true;
  const motionReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const connection = (navigator as NavigatorWithConnection).connection;
  return motionReduced || Boolean(connection?.saveData);
}

function subscribeToPreferences(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = (navigator as NavigatorWithConnection).connection;
  media.addEventListener("change", onChange);
  connection?.addEventListener?.("change", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    connection?.removeEventListener?.("change", onChange);
  };
}

export function SceneVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster: string;
  className?: string;
}) {
  const disabled = useSyncExternalStore(
    subscribeToPreferences,
    getReducedDataSnapshot,
    () => true,
  );

  if (disabled) return null;

  return (
    <video
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster}
      aria-hidden="true"
      tabIndex={-1}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
