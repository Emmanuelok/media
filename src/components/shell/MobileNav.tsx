"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Globe, Home, Library, Menu, Music2, Radio, Search, Settings, Tv, Wand2, X } from "lucide-react";
import { usePlayer } from "@/lib/store";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tv", label: "Live", icon: Tv },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: Library },
] as const;
const MORE_NAV = [
  { href: "/video", label: "Video", icon: Clapperboard },
  { href: "/music", label: "Music", icon: Music2 },
  { href: "/radio", label: "Radio", icon: Radio },
  { href: "/channels", label: "Networks", icon: Globe },
  { href: "/routines", label: "Routines", icon: Wand2 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export default function MobileNav() {
  const pathname = usePathname();
  const current = usePlayer((s) => s.current);
  const audioActive = current && current.kind !== "video" && current.kind !== "tv";
  const [open, setOpen] = useState(false);
  const secondaryActive = MORE_NAV.some(({ href }) => pathname.startsWith(href));

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
          />
          <div
            className={cn(
              "mobile-more-sheet absolute inset-x-3 rounded-[28px] border border-white/10 p-3",
              audioActive ? "bottom-40" : "bottom-20",
            )}
          >
            <div className="mb-2 flex items-center justify-between px-2 py-1">
              <div>
                <p className="text-sm font-semibold text-white">More of Aurora</p>
                <p className="text-[11px] text-white/40">Your library, routines and settings</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-full bg-white/8 text-white"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MORE_NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border border-white/8 px-3 py-3 text-sm",
                    pathname.startsWith(href)
                      ? "bg-white text-black"
                      : "bg-white/5 text-white/70",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="Primary"
        className={cn(
          "mobile-nav-lux fixed inset-x-3 z-50 flex items-stretch rounded-2xl border border-white/10 px-1 backdrop-blur-2xl md:hidden",
          audioActive ? "bottom-[5.45rem]" : "bottom-2",
        )}
      >
        {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[9px] font-medium transition",
                active ? "bg-white/10 text-white" : "text-white/40",
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", active && "text-accent")} />
              {label}
            </Link>
          );
        })}
        <button
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[9px] font-medium transition",
            open || secondaryActive ? "bg-white/10 text-white" : "text-white/40",
          )}
          aria-expanded={open}
          aria-label="More destinations"
        >
          <Menu className="h-[18px] w-[18px]" />
          More
        </button>
      </nav>
    </>
  );
}
