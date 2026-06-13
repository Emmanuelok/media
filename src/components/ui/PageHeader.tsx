import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  accent = "bg-gradient-to-br from-violet-500 to-fuchsia-500",
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  accent?: string;
}) {
  return (
    <header className="mb-6 flex items-center gap-3">
      <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-lg", accent)}>
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
    </header>
  );
}
