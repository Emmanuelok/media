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
      <header className="world-header">
        <div className="world-header-copy">
          <span className="world-header-eyebrow">
            <span className={cn("world-header-icon", accent)}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            {eyebrow ?? "Aurora collection"}
          </span>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
          <div className="world-header-index" aria-label="Aurora discovery modes">
            <span>
              <b>NOW</b>
              Active signals
            </span>
            <span>
              <b>FOR YOU</b>
              Intelligent curation
            </span>
            <span>
              <b>WORLD</b>
              Global discovery
            </span>
          </div>
        </div>
        <div className="world-header-media" aria-hidden="true">
          <Image
            src={image}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 42vw"
            className="world-header-image"
          />
          <div className="world-header-grade" />
          <div className="world-header-signal" />
        </div>
      </header>
    );
  }

  return (
    <header className="systems-header">
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white",
          accent,
        )}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <span className="systems-header-kicker">Aurora / Systems</span>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </header>
  );
}
