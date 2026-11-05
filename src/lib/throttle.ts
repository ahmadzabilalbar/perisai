import "server-only";

/**
 * In-memory helpers. State lives in this server instance only: it covers bursts of requests that land on
 * the same instance (the usual case for a small site), not traffic spread across many instances.
 */

const queues = new Map<string, Promise<unknown>>();

/**
 * Runs `fn` after every earlier call with the same key has finished (one at a time per key).
 * Never call serialize() with a key from inside a function already running under that key: it would wait forever.
 */
export function serialize<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const run = (queues.get(key) ?? Promise.resolve()).then(fn, fn);
  const tail = run.then(
    () => undefined,
    () => undefined,
  );
  queues.set(key, tail);
  void tail.then(() => {
    if (queues.get(key) === tail) queues.delete(key);
  });
  return run;
}

const hits = new Map<string, number[]>();

/** Records a hit for `key`; returns false if it already had `limit` hits in the last `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  // Keep the map from growing without bound
  if (hits.size > 5000) {
    for (const [k, ts] of hits) if (!ts.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return true;
}
