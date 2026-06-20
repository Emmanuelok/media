import { describe, it, expect } from "vitest";
import {
  DEFAULT_ROUTINES,
  isScheduleDue,
  isScheduleDueUTC,
  todayKey,
  utcDateKey,
  type Schedule,
} from "@/lib/routines";

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

describe("isScheduleDue", () => {
  const at = (h: number, m: number) => new Date(2026, 0, 1, h, m, 0);
  const base: Schedule = { id: "s1", label: "x", prompt: "p", time: "08:00", enabled: true, lastFired: null };

  it("fires only at the matching minute, when enabled", () => {
    expect(isScheduleDue(base, at(8, 0))).toBe(true);
    expect(isScheduleDue(base, at(8, 1))).toBe(false);
    expect(isScheduleDue({ ...base, enabled: false }, at(8, 0))).toBe(false);
  });

  it("does not refire once already fired today", () => {
    const now = at(8, 0);
    expect(isScheduleDue({ ...base, lastFired: todayKey(now) }, now)).toBe(false);
  });
});

describe("isScheduleDueUTC (server-side)", () => {
  const wall = new Date(Date.UTC(2026, 0, 1, 8, 0, 0));
  const base: Schedule = { id: "s1", label: "x", prompt: "p", time: "08:00", enabled: true, lastFired: null };

  it("fires when UTC wall-clock matches and not fired today", () => {
    expect(isScheduleDueUTC(base, wall)).toBe(true);
    expect(isScheduleDueUTC({ ...base, time: "08:01" }, wall)).toBe(false);
    expect(isScheduleDueUTC({ ...base, lastFired: utcDateKey(wall) }, wall)).toBe(false);
  });
});
