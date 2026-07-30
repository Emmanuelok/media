"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Settings, Wand2, Globe } from "lucide-react";
import { NAV } from "./nav";
import { usePlayer } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { Artwork } from "@/components/ui/Artwork";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const recents = usePlayer((s) => s.recents);
  const play = usePlayer((s) => s.play);
  const openConcierge = useUI((s) => s.openConcierge);

  return (
    <aside className="sidebar-lux sticky top-3 z-20 ml-3 hidden h-[calc(100vh-1.5rem)] w-[17rem] shrink-0 flex-col gap-1 rounded-[28px] border border-white/10 px-3 py-4 md:flex">
      <Link href="/" className="mb-5 flex items-center gap-3 px-2">
        <span className="brand-orbit">
          <span />
          <Sparkles className="relative z-10 h-4 w-4 text-white" />
        </span>
        <span className="leading-none">
          <span className="block text-lg font-semibold tracking-[-0.04em] text-white">
            Aurora
          </span>
          <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.24em] text-white/35">
            AI Media House
          </span>
        </span>
      </Link>

      <p className="mb-1 px-3 text-[9px] font-bold uppercase tracking-[0.24em] text-white/25">
        Explore
      </p>
      <nav aria-label="Primary" className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "sidebar-link-active text-white"
                  : "text-white/45 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", active && "text-white")} />
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_12px_var(--color-accent)]" />}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => openConcierge()}
        className="sidebar-ai mt-4 flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold text-white transition"
      >
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-black">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="text-left">
          <span className="block">Ask Aurora</span>
          <span className="block text-[10px] font-normal text-white/45">Describe a feeling</span>
        </span>
      </button>

      <p className="mb-1 mt-5 px-3 text-[9px] font-bold uppercase tracking-[0.24em] text-white/25">
        Personal
      </p>
      <Link
        href="/channels"
        aria-current={pathname.startsWith("/channels") ? "page" : undefined}
        className={cn(
          "sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
          pathname.startsWith("/channels")
            ? "sidebar-link-active text-white"
            : "text-white/45 hover:bg-white/5 hover:text-white",
        )}
      >
        <Globe className={cn("h-5 w-5", pathname.startsWith("/channels") && "text-accent")} />
        Networks
      </Link>

      <Link
        href="/routines"
        aria-current={pathname.startsWith("/routines") ? "page" : undefined}
        className={cn(
          "sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
          pathname.startsWith("/routines")
            ? "sidebar-link-active text-white"
            : "text-white/45 hover:bg-white/5 hover:text-white",
        )}
      >
        <Wand2 className={cn("h-5 w-5", pathname.startsWith("/routines") && "text-accent")} />
        Routines
      </Link>

      <Link
        href="/settings"
        aria-current={pathname.startsWith("/settings") ? "page" : undefined}
        className={cn(
          "sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
          pathname.startsWith("/settings")
            ? "sidebar-link-active text-white"
            : "text-white/45 hover:bg-white/5 hover:text-white",
        )}
      >
        <Settings className={cn("h-5 w-5", pathname.startsWith("/settings") && "text-accent")} />
        Settings
      </Link>

      {recents.length > 0 && (
        <div className="mt-5 min-h-0 flex-1 overflow-hidden">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Recently played
          </p>
          <div className="no-scrollbar flex h-full flex-col gap-0.5 overflow-y-auto pb-2">
            {recents.slice(0, 12).map((it) => (
              <button
                key={it.id}
                onClick={() => play(it)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-left transition hover:bg-white/5"
              >
                <Artwork
                  src={it.thumbnail}
                  title={it.title}
                  kind={it.kind}
                  rounded="rounded-md"
                  className="h-9 w-9 shrink-0"
                  contain={it.kind === "tv" || it.kind === "radio"}
                />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium text-white">{it.title}</span>
                  <span className="block truncate text-[11px] text-muted">{it.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
