"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Settings, Wand2 } from "lucide-react";
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
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-1 border-r border-white/10 bg-[#0a0a11] px-3 py-4 md:flex">
      <Link href="/" className="mb-4 flex items-center gap-2.5 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 shadow-lg shadow-fuchsia-500/20">
          <Sparkles className="h-5 w-5 text-white" />
        </span>
        <span className="leading-none">
          <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
            Aurora
          </span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            AI Media House
          </span>
        </span>
      </Link>

      <nav aria-label="Primary" className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-white/10 text-white"
                  : "text-muted hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-accent")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => openConcierge()}
        className="mt-3 flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600/90 to-fuchsia-600/90 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-600/20 transition hover:from-violet-600 hover:to-fuchsia-600"
      >
        <Sparkles className="h-4 w-4" /> Ask Aurora AI
      </button>

      <Link
        href="/routines"
        aria-current={pathname.startsWith("/routines") ? "page" : undefined}
        className={cn(
          "mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
          pathname.startsWith("/routines")
            ? "bg-white/10 text-white"
            : "text-muted hover:bg-white/5 hover:text-white",
        )}
      >
        <Wand2 className={cn("h-5 w-5", pathname.startsWith("/routines") && "text-accent")} />
        Routines
      </Link>

      <Link
        href="/settings"
        aria-current={pathname.startsWith("/settings") ? "page" : undefined}
        className={cn(
          "mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
          pathname.startsWith("/settings")
            ? "bg-white/10 text-white"
            : "text-muted hover:bg-white/5 hover:text-white",
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
