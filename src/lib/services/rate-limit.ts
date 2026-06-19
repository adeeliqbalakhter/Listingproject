import { NextRequest } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
  consecutiveBlocks: number;
}

const store = new Map<string, RateLimitEntry>();
const MAX_STORE_SIZE = 10_000;

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
  if (store.size > MAX_STORE_SIZE) {
    const entries = [...store.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
    const toRemove = entries.slice(0, store.size - MAX_STORE_SIZE);
    for (const [key] of toRemove) store.delete(key);
  }
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export const RATE_LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  otp: { windowMs: 60 * 1000, maxRequests: 3 },
  api: { windowMs: 60 * 1000, maxRequests: 60 },
  upload: { windowMs: 60 * 1000, maxRequests: 10 },
  search: { windowMs: 60 * 1000, maxRequests: 30 },
} satisfies Record<string, RateLimitConfig>;

export function getClientIpFromRequest(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  prefix = "global"
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup();

  const ip = getClientIpFromRequest(request);
  const key = `${prefix}:${ip}`;
  const now = Date.now();

  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs, consecutiveBlocks: entry?.consecutiveBlocks ?? 0 });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  entry.count++;
  if (entry.count > config.maxRequests) {
    entry.consecutiveBlocks++;
    const backoffMultiplier = Math.min(entry.consecutiveBlocks, 5);
    entry.resetAt = Math.max(entry.resetAt, now + config.windowMs * backoffMultiplier);
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

export function rateLimitResponse(resetAt: number): Response {
  return Response.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      },
    }
  );
}
