// Pluggable key-value storage. Uses Upstash / Vercel KV over REST when configured
// via env, otherwise an in-memory Map (dev only — not durable across serverless
// invocations). This underpins cross-device sync and web-push subscriptions.

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

export function kvConfigured(): boolean {
  return !!(KV_URL && KV_TOKEN);
}

const mem = new Map<string, string>();

async function upstash(cmd: (string | number)[]): Promise<unknown> {
  const res = await fetch(KV_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`kv ${res.status}`);
  const data = (await res.json()) as { result?: unknown };
  return data.result;
}

export async function kvGet(key: string): Promise<string | null> {
  if (!kvConfigured()) return mem.get(key) ?? null;
  const r = await upstash(["GET", key]);
  return r == null ? null : String(r);
}

export async function kvSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (!kvConfigured()) {
    mem.set(key, value);
    return;
  }
  await upstash(ttlSeconds ? ["SET", key, value, "EX", ttlSeconds] : ["SET", key, value]);
}

export async function kvGetJson<T>(key: string): Promise<T | null> {
  const s = await kvGet(key);
  if (s == null) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export async function kvSetJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  await kvSet(key, JSON.stringify(value), ttlSeconds);
}
