import { describe, it, expect } from "vitest";
import { buildTasteProfile } from "@/lib/taste";
import type { MediaItem } from "@/lib/types";

let n = 0;
const mk = (over: Partial<MediaItem>): MediaItem => ({
  id: `i${n++}`,
  kind: "music",
  title: "t",
  src: "x",
  ...over,
});

describe("buildTasteProfile", () => {
  it("summarizes by category, kind, and stated note", () => {
    const favs = [
      mk({ category: "Jazz", kind: "music", title: "A" }),
      mk({ category: "Jazz", kind: "music", title: "B" }),
      mk({ category: "Sci-Fi", kind: "video", title: "C" }),
    ];
    const p = buildTasteProfile(favs, [], "I love ambient");
    expect(p).toContain("ambient");
    expect(p).toContain("Jazz");
    expect(p.toLowerCase()).toContain("music");
  });

  it("is empty with no data and no note", () => {
    expect(buildTasteProfile([], [])).toBe("");
  });
});
