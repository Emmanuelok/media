import { describe, it, expect } from "vitest";
import { formatTime, formatCount, isHls, gradientFor } from "@/lib/utils";

describe("formatTime", () => {
  it("formats minutes:seconds", () => {
    expect(formatTime(75)).toBe("1:15");
    expect(formatTime(5)).toBe("0:05");
  });
  it("formats hours:minutes:seconds", () => {
    expect(formatTime(3661)).toBe("1:01:01");
  });
  it("returns LIVE for live / unknown durations", () => {
    expect(formatTime(Infinity)).toBe("LIVE");
    expect(formatTime(undefined)).toBe("LIVE");
    expect(formatTime(-5)).toBe("LIVE");
  });
});

describe("formatCount", () => {
  it("abbreviates large numbers", () => {
    expect(formatCount(999)).toBe("999");
    expect(formatCount(1500)).toBe("1.5K");
    expect(formatCount(2_000_000)).toBe("2M");
    expect(formatCount(3_400_000_000)).toBe("3.4B");
  });
  it("returns empty string for undefined", () => {
    expect(formatCount(undefined)).toBe("");
  });
});

describe("isHls", () => {
  it("detects .m3u8 with or without query", () => {
    expect(isHls("https://x/y.m3u8")).toBe(true);
    expect(isHls("https://x/y.m3u8?token=1")).toBe(true);
  });
  it("rejects non-HLS", () => {
    expect(isHls("https://x/y.mp4")).toBe(false);
  });
});

describe("gradientFor", () => {
  it("is deterministic and a CSS gradient", () => {
    expect(gradientFor("hello")).toBe(gradientFor("hello"));
    expect(gradientFor("hello")).toMatch(/^linear-gradient/);
  });
});
