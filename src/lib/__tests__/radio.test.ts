import { describe, expect, it } from "vitest";
import {
  isReliableRadioStation,
  radioPlaybackUrl,
  radioStationsToItems,
  type RbStation,
} from "@/lib/radio";

const NOW = Date.parse("2026-07-30T12:00:00Z");

function station(overrides: Partial<RbStation> = {}): RbStation {
  return {
    stationuuid: "11111111-1111-1111-1111-111111111111",
    name: "World Radio",
    url: "https://origin.example.com/listen.pls",
    url_resolved: "https://stream.example.com/live.mp3",
    favicon: "https://example.com/icon.png",
    tags: "news,world",
    country: "Canada",
    countrycode: "CA",
    language: "English",
    languagecodes: "en",
    votes: 10,
    codec: "MP3",
    bitrate: 128,
    clickcount: 2500,
    lastcheckok: 1,
    lastchecktime_iso8601: "2026-07-29T12:00:00Z",
    ssl_error: 0,
    timing_ms: 175,
    homepage: "https://example.com",
    ...overrides,
  };
}

describe("radio reliability", () => {
  it("requires a recent successful SSL-clean resolved stream in a browser codec", () => {
    expect(isReliableRadioStation(station(), NOW)).toBe(true);
    expect(isReliableRadioStation(station({ lastcheckok: 0 }), NOW)).toBe(false);
    expect(isReliableRadioStation(station({ ssl_error: 1 }), NOW)).toBe(false);
    expect(isReliableRadioStation(station({ codec: "FLAC" }), NOW)).toBe(false);
    expect(
      isReliableRadioStation(
        station({ lastchecktime_iso8601: "2026-07-01T12:00:00Z" }),
        NOW,
      ),
    ).toBe(false);
    expect(
      isReliableRadioStation(
        station({ url_resolved: "http://stream.example.com/live.mp3" }),
        NOW,
      ),
    ).toBe(false);
  });

  it("uses the resolved URL and exposes health, codec, language and source metadata", () => {
    const [item] = radioStationsToItems([station()], NOW);
    expect(item.src).toBe("https://stream.example.com/live.mp3");
    expect(item.id).toMatch(/^radio:11111111-1111-1111-1111-111111111111:/);
    expect(item.health).toBe("verified");
    expect(item.lastChecked).toBe("2026-07-29T12:00:00.000Z");
    expect(item.codec).toBe("MP3");
    expect(item.bitrate).toBe(128);
    expect(item.languages).toEqual(["English", "en"]);
    expect(item.sourceKind).toBe("public-directory");
    expect(item.latencyMs).toBe(175);
  });

  it("deduplicates by station UUID and resolved URL, not by title", () => {
    const duplicate = station();
    const sameTitleDifferentStation = station({
      stationuuid: "22222222-2222-2222-2222-222222222222",
      url_resolved: "https://other.example.com/live.mp3",
    });
    const sameStationDifferentStream = station({
      url_resolved: "https://backup.example.com/live.mp3",
    });

    const items = radioStationsToItems(
      [station(), duplicate, sameTitleDifferentStation, sameStationDifferentStream],
      NOW,
    );
    expect(items).toHaveLength(3);
    expect(new Set(items.map((item) => item.id)).size).toBe(3);
  });

  it("creates a safe click-counting redirect URL", () => {
    expect(radioPlaybackUrl("abc/123", 6)).toBe(
      "https://de2.api.radio-browser.info/json/url/abc%2F123",
    );
  });
});
