import { describe, it, expect } from "vitest";
import { kvGet, kvSet, kvGetJson, kvSetJson, kvConfigured } from "@/lib/kv";

describe("kv (in-memory fallback)", () => {
  it("is unconfigured without env (uses memory)", () => {
    expect(kvConfigured()).toBe(false);
  });
  it("round-trips strings and json", async () => {
    await kvSet("aurora:test:s", "hello");
    expect(await kvGet("aurora:test:s")).toBe("hello");
    await kvSetJson("aurora:test:j", { a: 1, b: [2, 3] });
    expect(await kvGetJson<{ a: number; b: number[] }>("aurora:test:j")).toEqual({ a: 1, b: [2, 3] });
    expect(await kvGet("aurora:test:missing")).toBeNull();
    expect(await kvGetJson("aurora:test:missing")).toBeNull();
  });
});
