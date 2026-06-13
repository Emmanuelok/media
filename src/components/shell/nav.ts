import { Home, Clapperboard, Music2, Tv, Radio, Sparkles } from "lucide-react";

export const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/video", label: "Video", icon: Clapperboard },
  { href: "/music", label: "Music", icon: Music2 },
  { href: "/tv", label: "Live TV", icon: Tv },
  { href: "/radio", label: "Radio", icon: Radio },
  { href: "/search", label: "AI Search", icon: Sparkles },
] as const;
