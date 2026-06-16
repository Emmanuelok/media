"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Globe, ExternalLink, Tv, Info } from "lucide-react";
import {
  BROADCASTERS,
  BROADCASTER_CATEGORIES,
  broadcasterCountries,
  type Broadcaster,
} from "@/lib/broadcasters";
import { Artwork } from "@/components/ui/Artwork";
import { PageHeader } from "@/components/ui/PageHeader";
import { Chips } from "@/components/ui/Chips";
import { EmptyState } from "@/components/ui/States";

function BroadcasterCard({ x }: { x: Broadcaster }) {
  const free = x.access === "free";
  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-surface/50 p-4">
      <div className="flex items-start gap-3">
        <Artwork
          src={x.logo}
          title={x.name}
          kind="tv"
          contain
          rounded="rounded-lg"
          className="h-12 w-12 shrink-0 bg-white"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">{x.name}</p>
          <p className="truncate text-xs text-muted">
            {x.flag} {x.country}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span
          className={
            free
              ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400"
              : "rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400"
          }
        >
          {free ? "Free-to-air" : "Subscription / Region"}
        </span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium capitalize text-white/80">
          {x.category}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {free && (
          <Link
            href={`/tv?country=${x.iptvCode}`}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            <Tv className="h-3.5 w-3.5" /> Live TV
          </Link>
        )}
        <a
          href={x.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Official
        </a>
      </div>
    </div>
  );
}

export default function ChannelsPage() {
  const countries = useMemo(() => broadcasterCountries(), []);
  const [cat, setCat] = useState("all");
  const [country, setCountry] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BROADCASTERS.filter((x) => {
      if (cat !== "all" && x.category !== cat) return false;
      if (country !== "all" && x.country !== country) return false;
      if (q && !`${x.name} ${x.country}`.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, z) => a.country.localeCompare(z.country) || a.name.localeCompare(z.name));
  }, [cat, country, query]);

  const catChips = [{ id: "all", label: "All" }, ...BROADCASTER_CATEGORIES.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji }))];

  return (
    <div className="animate-fade-up">
      <PageHeader
        icon={Globe}
        title="Global Networks"
        subtitle="Where to watch — official broadcasters by country, incl. World Cup rights-holders"
        accent="bg-gradient-to-br from-cyan-500 to-blue-600"
      />

      <div className="mb-5 flex items-start gap-2 rounded-xl border border-white/10 bg-surface/40 p-3 text-xs text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
        <p>
          <span className="font-semibold text-emerald-400">Free-to-air</span> broadcasters open in
          Aurora&apos;s Live TV (public streams).{" "}
          <span className="font-semibold text-amber-400">Subscription / region</span> services
          (FOX, Peacock, DSPORTS, DGO, ViX, ITVX, TUDN…) are licensed and geo-locked — those open in
          the broadcaster&apos;s official app, where a subscription or your region may be required.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search networks or countries…"
          className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-accent/60 focus:outline-none sm:max-w-xs"
        />
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-accent/60 focus:outline-none"
        >
          <option value="all">All countries ({countries.length})</option>
          {countries.map((c) => (
            <option key={c.country} value={c.country}>
              {c.flag} {c.country} ({c.count})
            </option>
          ))}
        </select>
      </div>

      <Chips className="mb-6" items={catChips} value={cat} onChange={setCat} />

      {filtered.length ? (
        <>
          <p className="mb-3 text-sm text-muted">{filtered.length} networks</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((x) => (
              <BroadcasterCard key={x.id} x={x} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState message="No networks match those filters." />
      )}
    </div>
  );
}
