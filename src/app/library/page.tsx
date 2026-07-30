"use client";

import Link from "next/link";
import { ArrowRight, Clock3, Heart, Library as LibraryIcon, Radio, Sparkles, Tv } from "lucide-react";
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
    <div className="animate-fade-up route-memory">
      <PageHeader
        icon={LibraryIcon}
        title="Your Library"
        subtitle="Favorites, history and what you were watching"
        accent="bg-gradient-to-br from-pink-500 to-rose-600"
        image="/aurora/library-world.webp"
        eyebrow="Your media memory"
      />

      {isEmpty ? (
        <section className="memory-empty" aria-labelledby="memory-empty-title">
          <div className="memory-empty-copy">
            <span>
              <Clock3 className="h-3.5 w-3.5" />
              Memory timeline / ready
            </span>
            <h2 id="memory-empty-title">Your first signal becomes the beginning.</h2>
            <p>
              Aurora remembers saved media, recent sessions and where you stopped. Start with a
              world, then this space becomes your personal timeline.
            </p>
            <Link href="/" className="signal-action-primary">
              <Sparkles className="h-4 w-4" />
              Explore Aurora
            </Link>
          </div>
          <div className="memory-starters">
            <Link href="/video">
              <span>
                <Heart className="h-4 w-4" />
                Save a story
              </span>
              <strong>Build a watchlist</strong>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/tv">
              <span>
                <Tv className="h-4 w-4" />
                Follow a signal
              </span>
              <strong>Discover live television</strong>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/radio">
              <span>
                <Radio className="h-4 w-4" />
                Tune into a place
              </span>
              <strong>Start a radio trail</strong>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="memory-ledger">
            <div>
              <span>Saved</span>
              <strong>{favorites.length}</strong>
            </div>
            <div>
              <span>Recent</span>
              <strong>{recents.length}</strong>
            </div>
            <div>
              <span>Continue</span>
              <strong>{continueWatching.length}</strong>
            </div>
            <p>Your timeline stays on this device unless you choose to sync it.</p>
          </section>
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
