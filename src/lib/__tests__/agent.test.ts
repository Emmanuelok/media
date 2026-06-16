import { describe, it, expect } from "vitest";
import { validateActions, resolveItems, searchCatalog, agentFallback } from "@/lib/agent";
import { LOCAL_INDEX } from "@/lib/catalog";
import type { MediaItem } from "@/lib/types";

describe("validateActions", () => {
  it("keeps valid actions and drops invalid ones", () => {
    const raw = [
      { type: "play", ids: ["video:sintel", 5, "music:1"] },
      { type: "set_sleep_timer", minutes: 30 },
      { type: "navigate", path: "/library" },
      { type: "navigate", path: "/evil" },
      { type: "search", kind: "tv", q: "news" },
      { type: "search", kind: "bogus", q: "x" },
      { type: "frobnicate" },
      "nope",
    ];
    const out = validateActions(raw);
    expect(out).toContainEqual({ type: "play", ids: ["video:sintel", "music:1"] });
    expect(out).toContainEqual({ type: "set_sleep_timer", minutes: 30 });
    expect(out).toContainEqual({ type: "navigate", path: "/library" });
    expect(out).toContainEqual({ type: "search", kind: "tv", q: "news" });
    expect(out.some((a) => a.type === "navigate" && a.path === "/evil")).toBe(false);
    expect(out.some((a) => a.type === "search")).toBe(true);
    expect(out.filter((a) => a.type === "search")).toHaveLength(1);
  });

  it("clamps sleep minutes to 1..180", () => {
    expect(validateActions([{ type: "set_sleep_timer", minutes: 9999 }])[0]).toEqual({
      type: "set_sleep_timer",
      minutes: 180,
    });
    expect(validateActions([{ type: "set_sleep_timer", minutes: 0 }])[0]).toEqual({
      type: "set_sleep_timer",
      minutes: 1,
    });
  });

  it("returns [] for non-arrays", () => {
    expect(validateActions(null)).toEqual([]);
    expect(validateActions("x")).toEqual([]);
  });
});

describe("resolveItems", () => {
  it("resolves catalog ids, dedups, ignores unknown", () => {
    const id = LOCAL_INDEX[0].id;
    const out = resolveItems([id, id, "nope:x"], new Map());
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe(id);
  });

  it("prefers items gathered during the run (dynamic radio/tv)", () => {
    const fake = { id: "radio:xyz", kind: "radio", title: "X FM", src: "https://x" } as MediaItem;
    const out = resolveItems(["radio:xyz"], new Map([["radio:xyz", fake]]));
    expect(out[0].title).toBe("X FM");
  });
});

describe("searchCatalog", () => {
  it("finds items by keyword", () => {
    expect(searchCatalog("sintel").some((i) => i.id === "video:sintel")).toBe(true);
  });
  it("returns nothing for blank input", () => {
    expect(searchCatalog("   ")).toEqual([]);
  });
});

describe("agentFallback", () => {
  it("plays catalog matches and surfaces live search chips", () => {
    const plan = agentFallback("play sintel and find live news");
    expect(plan.actions.some((a) => a.type === "play")).toBe(true);
    expect(plan.actions.some((a) => a.type === "search" && a.kind === "tv" && a.q === "news")).toBe(true);
    expect(plan.items.length).toBeGreaterThan(0);
  });
  it("adds a sleep timer for wind-down requests", () => {
    expect(agentFallback("something for sleep").actions.some((a) => a.type === "set_sleep_timer")).toBe(true);
  });
});
