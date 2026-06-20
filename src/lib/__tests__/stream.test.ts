import { describe, it, expect } from "vitest";
import { proxiedUrl, needsProxy, pool } from "@/lib/stream";

describe("proxiedUrl / needsProxy", () => {
  it("wraps a url through /api/stream", () => {
    expect(proxiedUrl("https://x/y.m3u8")).toBe("/api/stream?url=" + encodeURIComponent("https://x/y.m3u8"));
  });
  it("only http origins need proxying", () => {
    expect(needsProxy("http://x/y")).toBe(true);
    expect(needsProxy("https://x/y")).toBe(false);
  });
});

describe("pool", () => {
  it("processes every item with bounded concurrency", async () => {
    const seen: number[] = [];
    let active = 0;
    let maxActive = 0;
    await pool([1, 2, 3, 4, 5, 6, 7], 3, async (x) => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 5));
      seen.push(x);
      active--;
    });
    expect(seen.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(maxActive).toBeLessThanOrEqual(3);
  });
});
