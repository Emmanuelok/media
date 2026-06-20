"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { MediaGrid } from "@/components/media/Media";
import { EmptyState } from "@/components/ui/States";
import { checkStream, pool } from "@/lib/stream";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/lib/types";

/**
 * Live-TV grid with a "verify reachable" action. Free IPTV rotates constantly, so
 * this probes each stream server-side (via /api/check) and surfaces the ones that
 * are actually up — sorting working-first and optionally filtering out dead ones.
 */
export function ChannelGrid({ items }: { items: MediaItem[] }) {
  const [working, setWorking] = useState<Set<string> | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [onlyWorking, setOnlyWorking] = useState(true);

  // Forget previous results when the channel set changes.
  useEffect(() => {
    setWorking(null);
  }, [items]);

  const verify = async () => {
    if (verifying || !items.length) return;
    setVerifying(true);
    const ok = new Set<string>();
    await pool(items, 8, async (it) => {
      if (await checkStream(it.src)) ok.add(it.src);
    });
    setWorking(ok);
    setOnlyWorking(ok.size > 0); // don't hide everything if the probe found nothing
    setVerifying(false);
  };

  let displayed = items;
  if (working) {
    const rank = (it: MediaItem) => (working.has(it.src) ? 0 : 1);
    displayed = [...items].sort((a, b) => rank(a) - rank(b));
    if (onlyWorking) displayed = displayed.filter((it) => working.has(it.src));
  }
  const workingCount = working ? items.filter((it) => working.has(it.src)).length : 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={verify}
          disabled={verifying}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {verifying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5" />
          )}
          {verifying ? "Checking…" : working ? "Re-check" : "Verify reachable"}
        </button>
        {working && (
          <>
            <span className="text-xs text-muted">
              {workingCount}/{items.length} reachable
            </span>
            <button
              onClick={() => setOnlyWorking((v) => !v)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition",
                onlyWorking ? "bg-accent/20 text-accent" : "bg-white/10 text-muted hover:text-white",
              )}
            >
              {onlyWorking ? "Working only" : "Showing all"}
            </button>
          </>
        )}
      </div>
      {displayed.length ? (
        <MediaGrid items={displayed} />
      ) : (
        <EmptyState message="No reachable channels right now — try Re-check or another category." />
      )}
    </div>
  );
}
