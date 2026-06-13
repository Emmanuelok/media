import { describe, it, expect } from "vitest";
import { extractJson, sanitize, localFallback } from "@/lib/concierge";
import { LOCAL_INDEX } from "@/lib/catalog";

describe("extractJson", () => {
  it("parses fenced JSON", () => {
    expect(extractJson('```json\n{"reply":"hi","picks":[],"queries":[]}\n```')?.reply).toBe("hi");
  });
  it("parses JSON surrounded by prose", () => {
    expect(extractJson('Sure! {"reply":"x"} hope that helps')?.reply).toBe("x");
  });
  it("returns null for non-JSON", () => {
    expect(extractJson("no json here")).toBeNull();
  });
});

describe("sanitize", () => {
  it("keeps only valid catalog ids and known query kinds", () => {
    const validId = LOCAL_INDEX[0].id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = {
      reply: "ok",
      picks: [validId, "video:does-not-exist"],
      queries: [
        { kind: "tv", q: "news" },
        { kind: "bogus", q: "x" },
      ],
    };
    const out = sanitize(raw, "fb");
    expect(out.picks).toEqual([validId]);
    expect(out.queries).toEqual([{ kind: "tv", q: "news" }]);
  });
  it("uses the fallback reply when missing", () => {
    expect(sanitize(null, "fallback").reply).toBe("fallback");
  });
  it("keeps reasons only for valid picks", () => {
    const validId = LOCAL_INDEX[0].id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = {
      reply: "ok",
      picks: [validId],
      reasons: { [validId]: "great pick", "video:nope": "x" },
    };
    const out = sanitize(raw, "fb");
    expect(out.reasons[validId]).toBe("great pick");
    expect(out.reasons["video:nope"]).toBeUndefined();
  });
});

describe("localFallback", () => {
  it("maps intents to live TV/radio queries", () => {
    const out = localFallback("I want live news and some lofi to study");
    const kinds = out.queries.map((q) => `${q.kind}:${q.q}`);
    expect(kinds).toContain("tv:news");
    expect(kinds).toContain("radio:lofi");
  });
  it("finds catalog picks by keyword", () => {
    expect(localFallback("show me Sintel").picks).toContain("video:sintel");
  });
  it("caps queries at 3", () => {
    const out = localFallback("news sports lofi jazz rock classical movie");
    expect(out.queries.length).toBeLessThanOrEqual(3);
  });
});
