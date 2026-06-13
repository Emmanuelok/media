import { describe, it, expect } from "vitest";
import { ipBlocked, hostAllowed, rewriteHlsPlaylist, isCacheablePlaylist } from "@/lib/proxy";

describe("ipBlocked (SSRF guard)", () => {
  it("blocks private / loopback / link-local / metadata / CGNAT", () => {
    for (const ip of [
      "127.0.0.1",
      "10.0.0.5",
      "192.168.1.1",
      "172.16.0.1",
      "172.31.255.255",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "::1",
      "fd00::1",
      "fe80::1",
      "::ffff:127.0.0.1",
    ]) {
      expect(ipBlocked(ip), ip).toBe(true);
    }
  });
  it("allows public addresses", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "2606:4700::1"]) {
      expect(ipBlocked(ip), ip).toBe(false);
    }
  });
});

describe("hostAllowed", () => {
  it("permits everything when no allowlist is configured", () => {
    expect(hostAllowed("anything.example.com", [])).toBe(true);
  });
  it("matches exact host and dot-suffixes only", () => {
    const allow = ["akamaized.net", "cloudfront.net"];
    expect(hostAllowed("test.akamaized.net", allow)).toBe(true);
    expect(hostAllowed("akamaized.net", allow)).toBe(true);
    expect(hostAllowed("evil.com", allow)).toBe(false);
    expect(hostAllowed("notakamaized.net", allow)).toBe(false);
  });
});

describe("rewriteHlsPlaylist", () => {
  const base = "https://cdn.example.com/live/master.m3u8";
  const px = (u: string) => "/api/stream?url=" + encodeURIComponent(u);

  it("rewrites relative and absolute child URLs through the proxy", () => {
    const m3u = [
      "#EXTM3U",
      "#EXT-X-STREAM-INF:BANDWIDTH=800000",
      "chunk/360.m3u8",
      "#EXT-X-STREAM-INF:BANDWIDTH=2000000",
      "https://other.cdn/720.m3u8",
    ].join("\n");
    const out = rewriteHlsPlaylist(m3u, base);
    expect(out).toContain("#EXT-X-STREAM-INF:BANDWIDTH=800000"); // tags preserved
    expect(out).toContain(px("https://cdn.example.com/live/chunk/360.m3u8"));
    expect(out).toContain(px("https://other.cdn/720.m3u8"));
  });

  it("rewrites URI= attributes (keys / media / map)", () => {
    const m3u = '#EXT-X-KEY:METHOD=AES-128,URI="enc.key"\nseg1.ts';
    const out = rewriteHlsPlaylist(m3u, base);
    expect(out).toContain('URI="' + px("https://cdn.example.com/live/enc.key") + '"');
    expect(out).toContain(px("https://cdn.example.com/live/seg1.ts"));
  });
});

describe("isCacheablePlaylist", () => {
  it("caches master and VOD, never live", () => {
    expect(isCacheablePlaylist("#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1\na.m3u8")).toBe(true);
    expect(isCacheablePlaylist("#EXTM3U\n#EXT-X-ENDLIST")).toBe(true);
    expect(isCacheablePlaylist("#EXTM3U\n#EXT-X-MEDIA-SEQUENCE:5\nseg.ts")).toBe(false);
  });
});
