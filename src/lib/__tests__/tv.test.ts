import { describe, it, expect } from "vitest";
import { parseM3U } from "@/lib/tv";

const SAMPLE = [
  "#EXTM3U",
  '#EXTINF:-1 tvg-id="DW" tvg-logo="https://logos/dw.png" group-title="News",DW English (1080p)',
  "https://dw.example.com/stream.m3u8",
  '#EXTINF:-1 tvg-logo="x" group-title="Sports",Sky Sports 4K',
  "http://sky.example.com/live.m3u8",
  "#EXTINF:-1,FTP Channel",
  "ftp://nope.example.com/stream",
].join("\n");

describe("parseM3U", () => {
  it("keeps http and https, drops other schemes", () => {
    const items = parseM3U(SAMPLE, "news");
    expect(items).toHaveLength(2);
    expect(items[0].src).toBe("https://dw.example.com/stream.m3u8");
    expect(items[1].src).toBe("http://sky.example.com/live.m3u8");
  });

  it("extracts logo, group, name and a quality badge", () => {
    const [dw, sky] = parseM3U(SAMPLE, "news");
    expect(dw.thumbnail).toBe("https://logos/dw.png");
    expect(dw.subtitle).toBe("News");
    expect(dw.title).toContain("DW English");
    expect(dw.title).not.toContain("1080p");
    expect(dw.badge).toBe("HD");
    expect(dw.kind).toBe("tv");
    expect(dw.isLive).toBe(true);
    expect(sky.badge).toBe("4K");
  });
});
