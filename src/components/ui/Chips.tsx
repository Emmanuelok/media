"use client";

import { cn } from "@/lib/utils";

export interface Chip {
  id: string;
  label: string;
  emoji?: string;
}

export function Chips({
  items,
  value,
  onChange,
  className,
}: {
  items: Chip[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("no-scrollbar flex gap-2 overflow-x-auto pb-1", className)}
      role="group"
      aria-label="Filter options"
    >
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          aria-pressed={value === it.id}
          className={cn(
            "min-h-11 shrink-0 rounded-lg border px-3.5 py-2 text-sm font-medium transition",
            value === it.id
              ? "border-white bg-white text-black"
              : "border-white/10 bg-surface-2 text-muted hover:border-white/20 hover:bg-surface-2/70 hover:text-white",
          )}
        >
          {it.emoji ? `${it.emoji} ` : ""}
          {it.label}
        </button>
      ))}
    </div>
  );
}
