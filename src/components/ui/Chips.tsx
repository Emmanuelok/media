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
    <div className={cn("no-scrollbar flex gap-2 overflow-x-auto pb-1", className)}>
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
            value === it.id
              ? "bg-white text-black"
              : "bg-surface-2 text-muted hover:bg-surface-2/70 hover:text-white",
          )}
        >
          {it.emoji ? `${it.emoji} ` : ""}
          {it.label}
        </button>
      ))}
    </div>
  );
}
