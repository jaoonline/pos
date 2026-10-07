import "server-only";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

type Bucket = { count: number; resetAt: number };

// Single-process in-memory limiter. Sufficient for a single-shop deployment
// running one Node instance; would need a shared store (e.g. Redis) behind a load balancer.
const attempts = new Map<string, Bucket>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = attempts.get(key);

  if (!bucket || bucket.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > MAX_ATTEMPTS;
}

export function resetRateLimit(key: string) {
  attempts.delete(key);
}
