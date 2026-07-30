"use client";

import Link from "next/link";
import { Library as LibraryIcon, Sparkles } from "lucide-react";
import { usePlayer } from "@/lib/store";
import { Shelf } from "@/components/media/Media";
import { PageHeader } from "@/components/ui/PageHeader";

export default function LibraryPage() {
  const recents = usePlayer((s) => s.recents);
  const favorites = usePlayer((s) => s.favorites);
  const progressById = usePlayer((s) => s.progressById);

  const continueWatching = recents.filter((r) => r.kind === "video" && (progressById[r.id] ?? 0) > 0);
  const isEmpty = !favorites.length && !recents.length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        icon={LibraryIcon}
        title="Your Library"
        subtitle="Favorites, history and what you were watching"
        accent="bg-gradient-to-br from-pink-500 to-rose-600"
        image="/aurora/library-world.webp"
        eyebrow="Your media memory"
      />

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-surface/50 px-6 py-20 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600">
            <LibraryIcon className="h-7 w-7 text-white" />
          </span>
          <p className="mt-4 text-base font-semibold text-white">Your library is empty</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Like a song, video, channel or station to save it here — or just start playing something.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.03]"
          >
            <Sparkles className="h-4 w-4" /> Explore Aurora
          </Link>
        </div>
      ) : (
        <>
          <Shelf
            title="Continue Watching"
            subtitle="Pick up where you left off"
            items={continueWatching}
            cardWidth="w-60 sm:w-72"
          />
          <Shelf title="Liked" subtitle="Everything you've saved" items={favorites} cardWidth="w-44 sm:w-52" />
          <Shelf title="Recently Played" subtitle="Your latest" items={recents} cardWidth="w-44 sm:w-52" />
        </>
      )}
    </div>
  );
}
