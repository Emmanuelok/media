"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Clapperboard,
  Globe2,
  Headphones,
  Library,
  Music2,
  Play,
  Radio,
  Sparkles,
  Tv,
  Wand2,
  Zap,
} from "lucide-react";
import { useRef, type PointerEvent } from "react";

const SERVICES = [
  {
    href: "/video",
    eyebrow: "Cinema without walls",
    title: "Watch stories in their full dimension.",
    description: "Films, originals, shorts and 4K showcases—curated as one continuous visual world.",
    image: "/aurora/video-world.webp",
    icon: Clapperboard,
    className: "service-card-video md:col-span-7",
  },
  {
    href: "/music",
    eyebrow: "Sound that follows",
    title: "A soundtrack for every version of you.",
    description: "Albums, playlists and a persistent player that moves with you.",
    image: "/aurora/music-world.webp",
    icon: Music2,
    className: "service-card-music md:col-span-5",
  },
  {
    href: "/tv",
    eyebrow: "The world, live",
    title: "Be there while it happens.",
    description: "Free-to-air television, culture, news and live moments from across the globe.",
    image: "/aurora/live-tv-world.webp",
    icon: Tv,
    className: "service-card-tv md:col-span-5",
  },
  {
    href: "/radio",
    eyebrow: "35,000+ stations",
    title: "Tune into somewhere new.",
    description: "Voices, music and local energy from cities you know—and places you have yet to meet.",
    image: "/aurora/radio-world.webp",
    icon: Radio,
    className: "service-card-radio md:col-span-7",
  },
] as const;

const WORLDS = [
  {
    href: "/channels",
    eyebrow: "Global networks",
    title: "One planet. Thousands of signals.",
    image: "/aurora/global-world.webp",
    icon: Globe2,
  },
  {
    href: "/routines",
    eyebrow: "One-tap rituals",
    title: "Let the right media meet the moment.",
    image: "/aurora/routines-world.webp",
    icon: Wand2,
  },
  {
    href: "/library",
    eyebrow: "Your library",
    title: "Everything you love remembers where you left off.",
    image: "/aurora/library-world.webp",
    icon: Library,
  },
] as const;

function CinematicHero({ onAsk }: { onAsk: () => void }) {
  const heroRef = useRef<HTMLElement>(null);

  const tilt = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty("--hero-x", x.toFixed(3));
    event.currentTarget.style.setProperty("--hero-y", y.toFixed(3));
  };

  const resetTilt = () => {
    heroRef.current?.style.setProperty("--hero-x", "0");
    heroRef.current?.style.setProperty("--hero-y", "0");
  };

  return (
    <section
      ref={heroRef}
      onPointerMove={tilt}
      onPointerLeave={resetTilt}
      className="cinematic-hero"
      aria-labelledby="aurora-hero-title"
    >
      <div className="cinematic-hero-media" aria-hidden="true">
        <Image
          src="/aurora/hero-cinema.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, calc(100vw - 18rem)"
          className="object-cover"
        />
        <div className="cinematic-hero-wash" />
        <div className="cinematic-hero-grain" />
      </div>

      <div className="aurora-orbit" aria-hidden="true">
        <span className="aurora-orbit-ring aurora-orbit-ring-one" />
        <span className="aurora-orbit-ring aurora-orbit-ring-two" />
        <span className="aurora-orbit-ring aurora-orbit-ring-three" />
        <span className="aurora-orbit-core">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="aurora-orbit-node aurora-orbit-node-video">
          <Play className="h-3.5 w-3.5" fill="currentColor" />
        </span>
        <span className="aurora-orbit-node aurora-orbit-node-music">
          <Headphones className="h-3.5 w-3.5" />
        </span>
        <span className="aurora-orbit-node aurora-orbit-node-live">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
          LIVE
        </span>
      </div>

      <div className="cinematic-hero-copy">
        <div className="hero-kicker">
          <span className="hero-kicker-signal" />
          The AI media house
          <span className="text-white/35">/</span>
          Always in motion
        </div>

        <h1 id="aurora-hero-title">
          Every story.
          <br />
          Every sound.
          <br />
          <span>One living universe.</span>
        </h1>

        <p>
          Aurora brings film, music, live television and radio into one intelligent space—then
          learns the atmosphere you want next.
        </p>

        <div className="cinematic-hero-actions">
          <button onClick={onAsk} className="hero-primary-action">
            <Sparkles className="h-4 w-4" />
            Ask Aurora
            <ArrowUpRight className="h-4 w-4" />
          </button>
          <Link href="/video" className="hero-secondary-action">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-black">
              <Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" />
            </span>
            Enter the experience
          </Link>
        </div>
      </div>

      <div className="cinematic-hero-footer" aria-label="Aurora service highlights">
        <div>
          <strong>4K</strong>
          <span>Adaptive cinema</span>
        </div>
        <div>
          <strong>35K+</strong>
          <span>Live radio stations</span>
        </div>
        <div>
          <strong>Global</strong>
          <span>Television networks</span>
        </div>
        <div>
          <strong>One AI</strong>
          <span>Across every medium</span>
        </div>
      </div>

      <div className="hero-scroll-cue" aria-hidden="true">
        <span />
        Scroll to explore
      </div>
    </section>
  );
}

function ServiceWorlds() {
  return (
    <section className="landing-section" aria-labelledby="service-worlds-title">
      <div className="landing-section-heading">
        <div>
          <span className="section-index">01 / THE SPECTRUM</span>
          <h2 id="service-worlds-title">Four mediums. No borders.</h2>
        </div>
        <p>
          Move from an intimate album to a global live signal without losing your place—or the
          feeling that brought you there.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {SERVICES.map(({ href, eyebrow, title, description, image, icon: Icon, className }) => (
          <Link key={href} href={href} className={`service-world-card ${className}`}>
            <Image
              src={image}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 58vw"
              className="service-world-image"
            />
            <div className="service-world-scrim" />
            <div className="service-world-content">
              <span className="service-world-icon">
                <Icon className="h-4 w-4" />
              </span>
              <span className="service-world-eyebrow">{eyebrow}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="service-world-link">
                Explore
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ConciergeStory({ onAsk }: { onAsk: () => void }) {
  return (
    <section className="concierge-story" aria-labelledby="concierge-story-title">
      <div className="concierge-story-media">
        <Image
          src="/aurora/ai-concierge.webp"
          alt="A creative professional using Aurora's accessible voice-first media discovery"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
        <div className="concierge-story-glow" />
        <div className="concierge-query-card">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-100/75">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
            Aurora is listening
          </span>
          <p>“Something expansive, warm, and quietly energising.”</p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-white/55">
            <Zap className="h-3.5 w-3.5 text-lime-300" />
            Building a cross-media journey
          </div>
        </div>
      </div>

      <div className="concierge-story-copy">
        <span className="section-index">02 / INTELLIGENCE WITH TASTE</span>
        <h2 id="concierge-story-title">
          Don&apos;t search a catalogue.
          <span> Describe a feeling.</span>
        </h2>
        <p>
          Aurora understands intent across video, music, television and radio. Ask once, then watch
          it assemble a journey that can move from a documentary to a live station to the perfect
          late-night soundtrack.
        </p>
        <div className="concierge-capabilities">
          <span>Conversational discovery</span>
          <span>Cross-media curation</span>
          <span>One-tap queues</span>
          <span>Persistent playback</span>
        </div>
        <button onClick={onAsk} className="story-action">
          <Sparkles className="h-4 w-4" />
          Start with a feeling
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

function ConnectedWorlds() {
  return (
    <section className="landing-section" aria-labelledby="connected-worlds-title">
      <div className="landing-section-heading">
        <div>
          <span className="section-index">03 / BUILT AROUND YOU</span>
          <h2 id="connected-worlds-title">The universe beyond play.</h2>
        </div>
        <p>
          Global access, intelligent routines and a living library turn isolated streams into one
          personal media environment.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {WORLDS.map(({ href, eyebrow, title, image, icon: Icon }) => (
          <Link key={href} href={href} className="connected-world-card">
            <Image
              src={image}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="connected-world-scrim" />
            <div className="connected-world-copy">
              <span className="connected-world-icon">
                <Icon className="h-4 w-4" />
              </span>
              <span>{eyebrow}</span>
              <h3>{title}</h3>
              <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-white">
                Enter world
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function CinematicHome({ onAsk }: { onAsk: () => void }) {
  return (
    <>
      <CinematicHero onAsk={onAsk} />
      <ServiceWorlds />
      <ConciergeStory onAsk={onAsk} />
      <ConnectedWorlds />
    </>
  );
}
