// Best-effort in-memory rate limiter.
// On serverless hosts each instance keeps its own bucket, so this throttles
// abuse without guaranteeing a globally shared limit.
const buckets = new Map();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

export function rateLimit(key, { limit = MAX_REQUESTS, windowMs = WINDOW_MS } = {}) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfterMs: windowMs - (now - hits[0]) };
  }

  hits.push(now);
  buckets.set(key, hits);

  // Drop stale buckets so the map cannot grow without bound.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
    }
  }

  return { ok: true };
}
