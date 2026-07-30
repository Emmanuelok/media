import { describe, it, expect } from "vitest";
import { FEATURED_TV, parseM3U } from "@/lib/tv";

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

  it("uses the stream URL in deterministic candidate ids", () => {
    const playlist = [
      "#EXTM3U",
      '#EXTINF:-1 tvg-id="shared.channel",Shared Channel',
      "https://one.example.com/live.m3u8",
      '#EXTINF:-1 tvg-id="shared.channel",Shared Channel',
      "https://two.example.com/live.m3u8",
    ].join("\n");

    const first = parseM3U(playlist);
    const second = parseM3U(playlist);
    expect(first.map((item) => item.id)).toEqual(second.map((item) => item.id));
    expect(new Set(first.map((item) => item.id)).size).toBe(2);
    expect(first[0].id).toMatch(/^tv:shared-channel:/);
  });

  it("adds public-catalogue provenance and language metadata", () => {
    const playlist = [
      "#EXTM3U",
      '#EXTINF:-1 tvg-id="culture.example" tvg-language="English;French" tvg-country="CA" group-title="Culture",Culture World',
      "https://example.com/culture.m3u8",
    ].join("\n");
    const [item] = parseM3U(playlist);

    expect(item.languages).toEqual(["English", "French"]);
    expect(item.language).toBe("English");
    expect(item.countryCode).toBe("ca");
    expect(item.health).toBe("unknown");
    expect(item.sourceKind).toBe("public-directory");
  });
});

describe("FEATURED_TV", () => {
  it("has unique ids and official-page fallbacks for every feed", () => {
    expect(new Set(FEATURED_TV.map((item) => item.id)).size).toBe(FEATURED_TV.length);
    for (const item of FEATURED_TV) {
      expect(item.officialUrl).toMatch(/^https:\/\//);
      expect(item.sourceKind).toBe("official");
      expect(item.sourceLabel).toBeTruthy();
      expect(item.health).toBe("likely");
      expect(item.language).toBeTruthy();
    }
  });
});
