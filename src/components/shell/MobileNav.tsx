"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "./nav";
import { usePlayer } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const pathname = usePathname();
  const current = usePlayer((s) => s.current);
  const audioActive = current && current.kind !== "video" && current.kind !== "tv";

  return (
    <nav
      className={cn(
        "fixed inset-x-0 z-40 flex items-stretch border-t border-white/10 bg-[#0a0a11]/95 backdrop-blur-xl md:hidden",
        audioActive ? "bottom-20" : "bottom-0",
      )}
    >
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition",
              active ? "text-accent" : "text-muted",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
