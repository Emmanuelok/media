import Image from "next/image";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  accent = "bg-gradient-to-br from-violet-500 to-fuchsia-500",
  image,
  eyebrow,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  accent?: string;
  image?: string;
  eyebrow?: string;
}) {
  if (image) {
    return (
      <header className="route-hero">
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, calc(100vw - 18rem)"
          className="route-hero-image"
        />
        <div className="route-hero-scrim" />
        <div className="route-hero-orb" aria-hidden="true" />
        <div className="route-hero-copy">
          <span className="route-hero-eyebrow">
            <span className={cn("grid h-7 w-7 place-items-center rounded-full", accent)}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            {eyebrow ?? "Aurora collection"}
          </span>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>
    );
  }

  return (
    <header className="page-header-compact">
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-lg",
          accent,
        )}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
    </header>
  );
}
