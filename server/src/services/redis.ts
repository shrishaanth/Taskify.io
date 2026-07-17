import Redis from "ioredis";
import { config } from "../config";

/**
 * Redis is strictly optional. With REDIS_URL set we get:
 *   - Socket.IO pub/sub adapter (events reach users on ANY app instance)
 *   - cross-instance presence (who's online)
 *   - short-lived caching of hot reads (dashboard stats)
 *   - a distributed lock so scheduled jobs run once per cluster, not once
 *     per instance
 * Without it, everything degrades gracefully to single-instance behaviour.
 */

let client: Redis | null = null;
let available = false;

export function initRedis(): Redis | null {
  if (!config.redisUrl) {
    console.log("Redis: REDIS_URL not set — running in single-instance mode");
    return null;
  }
  client = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 2,
    lazyConnect: false,
    retryStrategy: (times) => Math.min(times * 500, 10_000),
  });
  client.on("ready", () => {
    available = true;
    console.log("Redis: connected");
  });
  client.on("error", (err) => {
    if (available) console.error("Redis error:", err.message);
    available = false;
  });
  return client;
}

export function getRedis(): Redis | null {
  return available && client ? client : null;
}

/** Duplicate connections for the Socket.IO adapter (it needs a dedicated
 * pub and sub connection, separate from the general-purpose client). */
export function duplicateForAdapter(): { pub: Redis; sub: Redis } | null {
  if (!client) return null;
  return { pub: client.duplicate(), sub: client.duplicate() };
}

// ── Cache helpers ───────────────────────────────────────────────────────────
// Simple read-through cache with TTL. Failures are swallowed: a cache being
// down must never break a request.

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const raw = await r.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    /* cache write failures are non-fatal */
  }
}

export async function cacheDelPrefix(prefix: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    const keys = await r.keys(`${prefix}*`);
    if (keys.length) await r.del(...keys);
  } catch {
    /* non-fatal */
  }
}

// ── Distributed lock ────────────────────────────────────────────────────────
// Scheduled jobs (due-soon reminders) must run once per cluster. Whichever
// instance grabs the lock first runs the job; the others skip that tick.
// With no Redis there's only one instance anyway, so the lock returns true.

export async function acquireJobLock(name: string, ttlSeconds: number): Promise<boolean> {
  const r = getRedis();
  if (!r) return true;
  try {
    const ok = await r.set(`lock:${name}`, config.instanceId, "EX", ttlSeconds, "NX");
    return ok === "OK";
  } catch {
    return true;
  }
}

// ── Presence ────────────────────────────────────────────────────────────────
// A Redis set of online userIds shared by all instances. Falls back to an
// in-memory map on single-instance deployments.

const localPresence = new Map<string, number>(); // userId -> connection count
const PRESENCE_KEY = "presence:online";

export async function presenceConnect(userId: string): Promise<void> {
  const count = (localPresence.get(userId) || 0) + 1;
  localPresence.set(userId, count);
  const r = getRedis();
  if (r) {
    try {
      await r.hincrby(PRESENCE_KEY, userId, 1);
    } catch { /* non-fatal */ }
  }
}

export async function presenceDisconnect(userId: string): Promise<void> {
  const count = (localPresence.get(userId) || 1) - 1;
  if (count <= 0) localPresence.delete(userId);
  else localPresence.set(userId, count);
  const r = getRedis();
  if (r) {
    try {
      const left = await r.hincrby(PRESENCE_KEY, userId, -1);
      if (left <= 0) await r.hdel(PRESENCE_KEY, userId);
    } catch { /* non-fatal */ }
  }
}

export async function presenceList(): Promise<string[]> {
  const r = getRedis();
  if (r) {
    try {
      const all = await r.hgetall(PRESENCE_KEY);
      return Object.entries(all)
        .filter(([, n]) => Number(n) > 0)
        .map(([id]) => id);
    } catch { /* fall through to local */ }
  }
  return [...localPresence.keys()];
}

/** Called on boot so a crashed instance's stale presence entries don't
 * linger forever. Only safe because taskify runs a known, small cluster —
 * every instance restarting within the same window rebuilds the hash. */
export async function presenceResetLocal(): Promise<void> {
  localPresence.clear();
}
