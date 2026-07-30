"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, ScanSearch, ShieldCheck } from "lucide-react";
import { ChannelTile } from "@/components/live/ChannelTile";
import { EmptyState } from "@/components/ui/States";
import { checkStream, pool } from "@/lib/stream";
import { cn } from "@/lib/utils";
import {
  channelCollectionKey,
  type SignalHealth,
} from "@/lib/channel-art";
import type { MediaItem } from "@/lib/types";

const AUTO_CHECK_COUNT = 8;
const MAX_CONCURRENCY = 4;

async function probe(items: MediaItem[]): Promise<Record<string, SignalHealth>> {
  const result: Record<string, SignalHealth> = {};
  await pool(items, MAX_CONCURRENCY, async (item) => {
    result[item.src] = (await checkStream(item.src)) ? "online" : "offline";
  });
  return result;
}

function initialHealth(items: MediaItem[]): Record<string, SignalHealth> {
  return Object.fromEntries(
    items
      .slice(0, AUTO_CHECK_COUNT)
      .map((item) => [item.src, "checking" satisfies SignalHealth]),
  );
}

function StatusCount({
  count,
  label,
  tone,
}: {
  count: number;
  label: string;
  tone: "online" | "offline" | "checking" | "unknown";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        tone === "online" && "border-emerald-300/15 bg-emerald-400/10 text-emerald-200",
        tone === "offline" && "border-rose-300/15 bg-rose-400/10 text-rose-200",
        tone === "checking" && "border-cyan-300/15 bg-cyan-400/10 text-cyan-100",
        tone === "unknown" && "border-white/10 bg-white/5 text-white/55",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "online" && "bg-emerald-300",
          tone === "offline" && "bg-rose-300",
          tone === "checking" && "animate-pulse bg-cyan-300",
          tone === "unknown" && "bg-white/30",
        )}
      />
      {count} {label}
    </span>
  );
}

/**
 * Live signal grid. A small first batch is tested automatically; users can scan
 * or retry the remaining stations. Checks stay capped at four concurrent requests.
 */
function ChannelGridSession({
  items,
  square,
}: {
  items: MediaItem[];
  square: boolean;
}) {
  const [health, setHealth] = useState<Record<string, SignalHealth>>(() => initialHealth(items));
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const targets = items.slice(0, AUTO_CHECK_COUNT);
    if (!targets.length) return;

    const activeRequest = ++requestId.current;
    void probe(targets).then((result) => {
      if (requestId.current !== activeRequest) return;
      setHealth((current) => ({ ...current, ...result }));
    });

    return () => {
      requestId.current += 1;
    };
  }, [items]);

  const scan = async (targets: MediaItem[]) => {
    if (!targets.length) return;
    const activeRequest = ++requestId.current;
    setHealth((current) => {
      const next = { ...current };
      for (const item of targets) next[item.src] = "checking";
      return next;
    });

    const result = await probe(targets);
    if (requestId.current !== activeRequest) return;
    setHealth((current) => ({ ...current, ...result }));
  };

  const getStatus = (item: MediaItem): SignalHealth => health[item.src] || "unknown";
  const counts = items.reduce(
    (total, item) => {
      total[getStatus(item)] += 1;
      return total;
    },
    { online: 0, offline: 0, checking: 0, unknown: 0 },
  );
  const scanning = counts.checking > 0;
  const retryTargets = counts.offline
    ? items.filter((item) => getStatus(item) === "offline")
    : counts.unknown
      ? items.filter((item) => getStatus(item) === "unknown")
      : items;
  const displayed = [...items]
    .sort((left, right) => {
      const rank: Record<SignalHealth, number> = {
        online: 0,
        checking: 1,
        unknown: 2,
        offline: 3,
      };
      return rank[getStatus(left)] - rank[getStatus(right)];
    })
    .filter((item) => !verifiedOnly || getStatus(item) === "online");

  const retryLabel = counts.offline
    ? `Retry ${counts.offline} unavailable`
    : counts.unknown
      ? `Check ${counts.unknown} untested`
      : "Re-check all";

  return (
    <section aria-label="Live signal directory">
      <div className="mb-5 overflow-hidden rounded-[1.4rem] border border-white/10 bg-[radial-gradient(circle_at_9%_0%,rgba(34,211,238,0.13),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                <ShieldCheck className="h-4 w-4" />
              </span>
              Signal health
            </div>
            <div
              className="mt-2 flex flex-wrap gap-1.5"
              aria-live="polite"
              aria-label={`${counts.online} online, ${counts.offline} unavailable, ${counts.checking} testing, ${counts.unknown} untested`}
            >
              <StatusCount count={counts.online} label="reachable" tone="online" />
              <StatusCount count={counts.offline} label="unavailable" tone="offline" />
              <StatusCount count={counts.checking} label="testing" tone="checking" />
              <StatusCount count={counts.unknown} label="untested" tone="unknown" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex min-h-11 rounded-full border border-white/10 bg-black/20 p-1">
              <button
                type="button"
                onClick={() => setVerifiedOnly(false)}
                className={cn(
                  "min-h-9 rounded-full px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                  !verifiedOnly ? "bg-white text-black" : "text-white/60 hover:text-white",
                )}
                aria-pressed={!verifiedOnly}
              >
                Show all
              </button>
              <button
                type="button"
                onClick={() => setVerifiedOnly(true)}
                className={cn(
                  "min-h-9 rounded-full px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                  verifiedOnly ? "bg-emerald-300 text-emerald-950" : "text-white/60 hover:text-white",
                )}
                aria-pressed={verifiedOnly}
              >
                  Reachable only
              </button>
            </div>

            <button
              type="button"
              onClick={() => void scan(retryTargets)}
              disabled={scanning}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 text-xs font-semibold text-cyan-100 transition hover:border-cyan-200/35 hover:bg-cyan-300/15 disabled:cursor-wait disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              aria-label={retryLabel}
            >
              {scanning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <ScanSearch className="h-4 w-4" />
              )}
              {scanning ? "Testing signals…" : retryLabel}
            </button>
          </div>
        </div>
      </div>

      {displayed.length ? (
        <div
          className={cn(
            "grid gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
            square ? "grid-cols-2 2xl:grid-cols-6" : "grid-cols-1 2xl:grid-cols-5",
          )}
        >
          {displayed.map((item) => (
            <ChannelTile
              key={item.id}
              item={item}
              queue={displayed}
              square={square}
              status={getStatus(item)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          message={
            scanning
              ? "The first signal checks are still running."
              : "No reachable signals are visible. Choose Show all, then retry unavailable stations."
          }
        />
      )}
    </section>
  );
}

export function ChannelGrid({
  items,
  square,
}: {
  items: MediaItem[];
  square?: boolean;
}) {
  const resolvedSquare = square ?? items.every((item) => item.kind === "radio" || item.audioOnly);
  return (
    <ChannelGridSession
      key={channelCollectionKey(items)}
      items={items}
      square={resolvedSquare}
    />
  );
}
