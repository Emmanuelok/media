"use client";

import { X, Trash2, ListMusic } from "lucide-react";
import { usePlayer } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { Artwork } from "@/components/ui/Artwork";
import { cn } from "@/lib/utils";

export default function QueuePanel() {
  const open = useUI((s) => s.queueOpen);
  const close = useUI((s) => s.closeQueue);
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const current = usePlayer((s) => s.current);
  const jumpTo = usePlayer((s) => s.jumpTo);
  const removeAt = usePlayer((s) => s.removeAt);
  const clearQueue = usePlayer((s) => s.clearQueue);

  if (!open || !current) return null;

  return (
    <div className="fixed bottom-24 right-3 z-50 flex max-h-[60vh] w-[min(92vw,380px)] flex-col rounded-2xl border border-white/10 bg-[#0b0b13]/95 shadow-2xl backdrop-blur-xl">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <ListMusic className="h-4 w-4 text-accent" />
          <span className="text-sm font-bold text-white">Up Next</span>
          <span className="text-xs text-muted">· {queue.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearQueue}
            className="rounded-full p-1.5 text-muted transition hover:text-white"
            aria-label="Clear queue"
            title="Clear queue"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={close}
            className="rounded-full p-1.5 text-muted transition hover:text-white"
            aria-label="Close queue"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto p-2">
        {queue.map((item, i) => {
          const active = i === index;
          return (
            <div
              key={`${item.id}-${i}`}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-2 py-1.5",
                active ? "bg-white/10" : "hover:bg-white/5",
              )}
            >
              <button
                onClick={() => jumpTo(i)}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                <span className="relative shrink-0">
                  <Artwork
                    src={item.thumbnail}
                    title={item.title}
                    kind={item.kind}
                    rounded="rounded-md"
                    className="h-9 w-9"
                    contain={item.kind === "tv" || item.kind === "radio"}
                  />
                  {active && (
                    <span className="absolute inset-0 grid place-items-center rounded-md bg-black/50 text-accent">
                      <span className="eq" aria-hidden>
                        <i />
                        <i />
                        <i />
                      </span>
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className={cn("block truncate text-xs font-medium", active ? "text-accent" : "text-white")}>
                    {item.title}
                  </span>
                  <span className="block truncate text-[11px] text-muted">{item.subtitle}</span>
                </span>
              </button>
              {!active && (
                <button
                  onClick={() => removeAt(i)}
                  className="shrink-0 rounded-full p-1 text-muted opacity-0 transition hover:text-white group-hover:opacity-100"
                  aria-label="Remove from queue"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
