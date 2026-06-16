import { describe, it, expect } from "vitest";
import { DEFAULT_ROUTINES } from "@/lib/routines";

describe("DEFAULT_ROUTINES", () => {
  it("each routine has a unique id and a non-empty title + prompt", () => {
    const ids = new Set<string>();
    for (const r of DEFAULT_ROUTINES) {
      expect(r.title.trim().length).toBeGreaterThan(0);
      expect(r.prompt.trim().length).toBeGreaterThan(0);
      expect(ids.has(r.id)).toBe(false);
      ids.add(r.id);
    }
    expect(DEFAULT_ROUTINES.length).toBeGreaterThanOrEqual(4);
  });
});
