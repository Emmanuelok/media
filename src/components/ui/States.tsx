import { AlertTriangle, SearchX } from "lucide-react";

const GRID =
  "grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

export function SkeletonGrid({ count = 18, square = false }: { count?: number; square?: boolean }) {
  return (
    <div className={GRID}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div
            className={`${square ? "aspect-square" : "aspect-video"} animate-pulse rounded-xl bg-surface-2`}
          />
          <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-surface-2" />
          <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-surface/50 px-6 py-16 text-center">
      <AlertTriangle className="h-8 w-8 text-amber-400" />
      <p className="mt-3 text-sm font-medium text-white">Couldn&apos;t load this right now</p>
      <p className="mt-1 max-w-md text-sm text-muted">
        {message || "The directory may be temporarily unreachable. Please try again."}
      </p>
    </div>
  );
}

export function EmptyState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-surface/50 px-6 py-16 text-center">
      <SearchX className="h-8 w-8 text-muted" />
      <p className="mt-3 text-sm font-medium text-white">Nothing here yet</p>
      <p className="mt-1 max-w-md text-sm text-muted">{message || "Try a different filter or search."}</p>
    </div>
  );
}
