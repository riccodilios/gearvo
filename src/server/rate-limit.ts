/**
 * Production-ready rate limiter.
 * Uses in-memory Map locally; uses Upstash Redis when UPSTASH_REDIS_REST_URL is set.
 */

type Bucket = { count: number; resetAt: number };
const memory = new Map<string, Bucket>();

async function redisLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ ok: boolean; remaining: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('no redis');

  const windowSec = Math.ceil(windowMs / 1000);
  const redisKey = `rl:${key}`;

  const incr = await fetch(`${url}/incr/${encodeURIComponent(redisKey)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const incrJson = (await incr.json()) as { result: number };
  const count = incrJson.result;

  if (count === 1) {
    await fetch(`${url}/expire/${encodeURIComponent(redisKey)}/${windowSec}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  return { ok: count <= limit, remaining: Math.max(0, limit - count) };
}

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  entry.count += 1;
  return { ok: entry.count <= limit, remaining: Math.max(0, limit - entry.count) };
}

export async function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000
): Promise<{ ok: boolean; remaining: number }> {
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      return await redisLimit(key, limit, windowMs);
    }
  } catch {
    // fall through to memory
  }
  return memoryLimit(key, limit, windowMs);
}

export async function assertRateLimit(key: string, limit = 30, windowMs = 60_000) {
  const { ok } = await rateLimit(key, limit, windowMs);
  if (!ok) {
    const { AppError } = await import('@/server/errors');
    throw new AppError('RATE_LIMIT');
  }
}
