import { describe, it, expect } from "vitest";
import { BROADCASTERS, broadcasterCountries, findBroadcasters } from "@/lib/broadcasters";

describe("BROADCASTERS", () => {
  it("every entry is well-formed with a unique id", () => {
    const ids = new Set<string>();
    for (const x of BROADCASTERS) {
      expect(x.name.length).toBeGreaterThan(0);
      expect(x.url.startsWith("https://")).toBe(true);
      expect(["sports", "news", "general"]).toContain(x.category);
      expect(["free", "provider"]).toContain(x.access);
      expect(x.iptvCode.length).toBeGreaterThanOrEqual(2);
      expect(ids.has(x.id), `dup id ${x.id}`).toBe(false);
      ids.add(x.id);
    }
    expect(BROADCASTERS.length).toBeGreaterThan(50);
  });

  it("derives countries with positive counts", () => {
    const cs = broadcasterCountries();
    expect(cs.length).toBeGreaterThan(20);
    expect(cs.every((c) => c.count > 0 && c.iptvCode.length >= 2)).toBe(true);
  });
});

describe("findBroadcasters", () => {
  it("filters by country (code or name) and category", () => {
    const us = findBroadcasters({ country: "us" });
    expect(us.length).toBeGreaterThan(0);
    expect(us.every((x) => x.iptvCode === "us")).toBe(true);
    expect(findBroadcasters({ country: "USA", category: "sports" }).every((x) => x.category === "sports")).toBe(true);
  });
  it("matches free-text queries", () => {
    expect(findBroadcasters({ query: "peacock" }).some((x) => x.name === "Peacock")).toBe(true);
  });
});
