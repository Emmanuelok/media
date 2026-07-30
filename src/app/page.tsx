"use client";

import { ArrowUpRight, Sparkles } from "lucide-react";
import SignalHouse from "@/components/landing/SignalHouse";
import { Shelf } from "@/components/media/Media";
import { LiveShelf } from "@/components/live/LiveShelf";
import { VIDEOS, TRACKS } from "@/lib/catalog";
import { FEATURED_TV } from "@/lib/tv";
import { topRadio } from "@/lib/radio";
import { useUI } from "@/lib/ui";
import { usePlayer } from "@/lib/store";
import { DEFAULT_ROUTINES } from "@/lib/routines";

export default function Home() {
  const openConcierge = useUI((s) => s.openConcierge);
  const recents = usePlayer((s) => s.recents);
  const progressById = usePlayer((s) => s.progressById);
  const continueWatching = recents.filter((r) => r.kind === "video" && (progressById[r.id] ?? 0) > 0);

  return (
    <div className="animate-fade-up">
      <SignalHouse onAsk={() => openConcierge()} />

      <section className="landing-section routine-flightdeck" aria-labelledby="routine-flightdeck-title">
        <div className="landing-section-heading">
          <div>
            <span className="section-index">04 / SET THE ATMOSPHERE</span>
            <h2 id="routine-flightdeck-title">One tap. A whole scene.</h2>
          </div>
          <p>
            Start with an intention and Aurora prepares the media around it—from focus to live
            news to a quiet wind-down.
          </p>
        </div>

        <div className="routine-orbit">
          {DEFAULT_ROUTINES.map((r) => (
            <button
              key={r.id}
              onClick={() => openConcierge(r.prompt, true)}
              title={r.description}
              className="routine-orbit-card"
            >
              <span className="routine-orbit-emoji">{r.emoji}</span>
              <span>
                <strong>{r.title}</strong>
                <small>{r.description}</small>
              </span>
              <ArrowUpRight className="ml-auto h-4 w-4 text-white/45" />
            </button>
          ))}
        </div>
      </section>

      <section className="landing-section discovery-deck" aria-labelledby="discovery-deck-title">
        <div className="landing-section-heading">
          <div>
            <span className="section-index">05 / PLAY SOMETHING REMARKABLE</span>
            <h2 id="discovery-deck-title">Your next signal is already here.</h2>
          </div>
          <button onClick={() => openConcierge()} className="discovery-ask">
            <Sparkles className="h-4 w-4" />
            Let Aurora choose
          </button>
        </div>

        {continueWatching.length > 0 && (
          <Shelf
            title="Continue Watching"
            subtitle="Jump back in"
            items={continueWatching}
            cardWidth="w-60 sm:w-72"
          />
        )}
        <Shelf title="Trending Now" subtitle="What the world is watching" items={VIDEOS.slice(0, 8)} cardWidth="w-60 sm:w-72" />
        <Shelf
          title="Live TV · Featured Channels"
          subtitle="Free-to-air, around the world"
          items={FEATURED_TV}
          cardWidth="w-60 sm:w-72"
        />
        <Shelf
          title="Fresh on Aurora Sound"
          subtitle="New music for every mood"
          items={TRACKS}
          cardWidth="w-40 sm:w-44"
        />
        <LiveShelf
          title="Top Radio Right Now"
          subtitle="Live stations trending globally"
          loader={() => topRadio(24)}
          cardWidth="w-40 sm:w-44"
        />
        <Shelf
          title="Quick Watches"
          subtitle="Short and sweet"
          items={VIDEOS.filter((v) => v.category === "Shorts")}
          cardWidth="w-60 sm:w-72"
        />
      </section>
    </div>
  );
}
