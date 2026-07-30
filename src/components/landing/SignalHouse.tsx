"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clapperboard,
  Globe2,
  Headphones,
  Library,
  Music2,
  Radio,
  Satellite,
  Sparkles,
  Tv,
  WandSparkles,
  Waves,
} from "lucide-react";
import { SceneVideo } from "@/components/system/SceneVideo";

const SIGNAL_MODES = [
  {
    id: "now",
    label: "Now",
    title: "Verified live signals",
    copy: "See reachability and source context before you press play.",
    href: "/tv",
    icon: Satellite,
  },
  {
    id: "for-you",
    label: "For you",
    title: "Journeys with intent",
    copy: "Describe the atmosphere. Aurora connects the right media.",
    href: "/search",
    icon: Sparkles,
  },
  {
    id: "world",
    label: "World",
    title: "Culture without borders",
    copy: "Move across public television, radio, language and place.",
    href: "/channels",
    icon: Globe2,
  },
] as const;

const MEDIA_WORLDS = [
  {
    href: "/video",
    index: "01",
    kicker: "Screening room",
    title: "Stories become architecture.",
    copy: "Original short films and cinematic showcases, programmed as an editorial journey.",
    image: "/aurora/video-world.webp",
    icon: Clapperboard,
    tone: "coral",
  },
  {
    href: "/music",
    index: "02",
    kicker: "Sonic field",
    title: "Sound leaves a physical trace.",
    copy: "Albums, playlists and one persistent player that follows the moment.",
    image: "/aurora/music-world.webp",
    icon: Music2,
    tone: "gold",
  },
  {
    href: "/tv",
    index: "03",
    kicker: "Live deck",
    title: "The world, while it is happening.",
    copy: "Public global television with source status, resilient artwork and official fallbacks.",
    image: "/aurora/live-tv-world.webp",
    icon: Tv,
    tone: "cyan",
  },
  {
    href: "/radio",
    index: "04",
    kicker: "World tuner",
    title: "Every city has a frequency.",
    copy: "Scan reliable radio signals by place, genre and sound—without losing your queue.",
    image: "/aurora/radio-world.webp",
    icon: Radio,
    tone: "violet",
  },
] as const;

const SYSTEM_WORLDS = [
  {
    href: "/channels",
    kicker: "Network atlas",
    title: "Find the official way in.",
    copy: "Browse broadcasters, access types and Aurora availability across continents.",
    image: "/aurora/global-world.webp",
    icon: Globe2,
  },
  {
    href: "/routines",
    kicker: "Scene composer",
    title: "Turn intention into atmosphere.",
    copy: "Focus, global news, discovery and wind-down scenes—ready in one action.",
    image: "/aurora/routines-world.webp",
    icon: WandSparkles,
  },
  {
    href: "/library",
    kicker: "Memory timeline",
    title: "Your media remembers.",
    copy: "Return to saved signals, recent discoveries and the exact place you stopped.",
    image: "/aurora/library-world.webp",
    icon: Library,
  },
] as const;

export default function SignalHouse({ onAsk }: { onAsk: () => void }) {
  return (
    <div className="signal-house">
      <section className="signal-hero" aria-labelledby="signal-hero-title">
        <div className="signal-hero-media" aria-hidden="true">
          <Image
            src="/aurora/hero-cinema.webp"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, calc(100vw - 19rem)"
            className="signal-hero-poster"
          />
          <SceneVideo
            className="signal-hero-film"
            poster="/aurora/hero-cinema.webp"
            src="/aurora-motion/living-signal-web.mp4"
          />
          <div className="signal-hero-grade" />
          <div className="signal-hero-scan" />
        </div>

        <div className="signal-hero-copy">
          <div className="signal-kicker">
            <span className="signal-kicker-dot" />
            Aurora / The Signal House
          </div>
          <h1 id="signal-hero-title">
            The world is
            <span> transmitting.</span>
          </h1>
          <p>
            Film, music, public television and radio move through one intelligent media house—alive
            to place, time and what you want to feel next.
          </p>
          <div className="signal-hero-actions">
            <Link href="/tv" className="signal-action-primary">
              Enter live world
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button onClick={onAsk} className="signal-action-secondary">
              <Sparkles className="h-4 w-4" />
              Ask Aurora
            </button>
          </div>
        </div>

        <div className="signal-hero-console" aria-label="Aurora platform status">
          <div className="signal-console-heading">
            <span>
              <Waves className="h-4 w-4" />
              Signal console
            </span>
            <strong>ON AIR</strong>
          </div>
          <div className="signal-console-wave" aria-hidden="true">
            {Array.from({ length: 28 }).map((_, index) => (
              <span key={index} style={{ "--bar": (index % 7) + 1 } as React.CSSProperties} />
            ))}
          </div>
          <dl>
            <div>
              <dt>Delivery</dt>
              <dd>Direct first</dd>
            </div>
            <div>
              <dt>Live trust</dt>
              <dd>Source aware</dd>
            </div>
            <div>
              <dt>Fallback</dt>
              <dd>Official page</dd>
            </div>
          </dl>
        </div>

        <div className="signal-mode-rail">
          {SIGNAL_MODES.map(({ id, label, title, copy, href, icon: Icon }) => (
            <Link href={href} key={id} className="signal-mode-card">
              <span className="signal-mode-icon">
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <small>{label}</small>
                <strong>{title}</strong>
                <em>{copy}</em>
              </span>
              <ArrowRight className="ml-auto h-4 w-4" />
            </Link>
          ))}
        </div>
      </section>

      <section className="signal-story" aria-labelledby="signal-story-title">
        <header className="signal-section-heading">
          <div>
            <span>01 / THE TRANSMISSION</span>
            <h2 id="signal-story-title">One signal. Four forms.</h2>
          </div>
          <p>
            The interface changes grammar with the medium: film becomes frames, music becomes
            frequency, television becomes live status, and radio becomes place.
          </p>
        </header>

        <div className="signal-world-grid">
          {MEDIA_WORLDS.map(({ href, index, kicker, title, copy, image, icon: Icon, tone }) => (
            <Link href={href} key={href} className={`signal-world-card signal-tone-${tone}`}>
              <Image
                src={image}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="signal-world-image"
              />
              <div className="signal-world-grade" />
              <div className="signal-world-line" aria-hidden="true" />
              <div className="signal-world-topline">
                <span>{index}</span>
                <Icon className="h-4 w-4" />
              </div>
              <div className="signal-world-copy">
                <small>{kicker}</small>
                <h3>{title}</h3>
                <p>{copy}</p>
                <span className="signal-world-link">
                  Enter
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="signal-intelligence" aria-labelledby="signal-intelligence-title">
        <div className="signal-intelligence-media">
          <Image
            src="/aurora/ai-concierge.webp"
            alt="An adult creative professional using Aurora's accessible media discovery"
            fill
            sizes="(max-width: 768px) 100vw, 48vw"
            className="object-cover"
          />
          <div className="signal-intelligence-grade" />
          <div className="signal-intent-path" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="signal-query">
            <span>
              <Sparkles className="h-3.5 w-3.5" />
              Intent understood
            </span>
            <p>“Show me the world, but keep the pace calm.”</p>
          </div>
        </div>
        <div className="signal-intelligence-copy">
          <span>02 / INTELLIGENCE WITH TASTE</span>
          <h2 id="signal-intelligence-title">
            Search less.
            <br />
            <em>Describe more.</em>
          </h2>
          <p>
            Aurora can turn one natural-language request into a reversible media journey across
            films, albums, reliable live channels and radio.
          </p>
          <button onClick={onAsk} className="signal-action-primary">
            Compose a journey
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="signal-story" aria-labelledby="signal-system-title">
        <header className="signal-section-heading">
          <div>
            <span>03 / BEYOND THE PLAYER</span>
            <h2 id="signal-system-title">A media house that keeps context.</h2>
          </div>
          <p>
            Move from discovery to a scheduled scene to your personal timeline without breaking the
            thread.
          </p>
        </header>
        <div className="signal-system-grid">
          {SYSTEM_WORLDS.map(({ href, kicker, title, copy, image, icon: Icon }) => (
            <Link href={href} key={href} className="signal-system-card">
              <Image
                src={image}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
              <div className="signal-system-grade" />
              <span className="signal-system-icon">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <small>{kicker}</small>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
              <ArrowRight className="signal-system-arrow h-4 w-4" />
            </Link>
          ))}
        </div>
      </section>

      <section className="signal-final">
        <div aria-hidden="true">
          <Headphones />
          <Satellite />
          <Globe2 />
        </div>
        <span>THE SIGNAL IS READY</span>
        <h2>What should Aurora become next?</h2>
        <p>
          Start with a live place, a cinematic story, a sound—or simply the atmosphere in your head.
        </p>
        <button onClick={onAsk} className="signal-action-primary">
          <Sparkles className="h-4 w-4" />
          Open Aurora AI
        </button>
      </section>
    </div>
  );
}
