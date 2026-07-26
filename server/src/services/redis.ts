import Redis from 'ioredis';
import { config } from '../config';

let client: Redis | null = null;
let available = false;

export function initRedis(): Redis | null {
  if (!config.redisUrl) {
    console.log('Redis: not configured — running in single-instance mode');
    return null;
  }
  client = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 2,
    retryStrategy: (times) => Math.min(times * 500, 10_000),
  });
  client.on('ready', () => {
    available = true;
    console.log('Redis: connected');
  });
  client.on('error', (err) => {
    if (available) console.error('Redis error:', err.message);
    available = false;
  });
  return client;
}

export function getRedis(): Redis | null {
  return available && client ? client : null;
}

export function duplicateForAdapter(): { pub: Redis; sub: Redis } | null {
  if (!client) return null;
  return { pub: client.duplicate(), sub: client.duplicate() };
}

// ── Cache helpers ────────────────────────────────────────────

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

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    /* non-fatal */
  }
}

export const cacheDelPrefix = cacheDelPattern;
export const presenceList = getOnlineUsers;

export async function cacheDel(key: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.del(key);
  } catch {
    /* non-fatal */
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    // Use SCAN for production safety (not KEYS)
    let cursor = '0';
    do {
      const result = await r.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      const keys = result[1];
      if (keys.length) await r.del(...keys);
    } while (cursor !== '0');
  } catch {
    /* non-fatal */
  }
}

// ── Distributed lock ─────────────────────────────────────────

export async function acquireLock(
  name: string,
  ttlSeconds: number,
): Promise<boolean> {
  const r = getRedis();
  if (!r) return true; // single instance
  try {
    const ok = await r.set(`lock:${name}`, '1', 'EX', ttlSeconds, 'NX');
    return ok === 'OK';
  } catch {
    return true;
  }
}

// Alias for backward compatibility with old job code
export const acquireJobLock = acquireLock;

// ── Presence ─────────────────────────────────────────────────

const localPresence = new Map<string, number>();

export async function presenceConnect(userId: string): Promise<void> {
  localPresence.set(userId, (localPresence.get(userId) || 0) + 1);
  const r = getRedis();
  if (r) {
    try {
      await r.sadd('presence:online', userId);
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
      await r.srem('presence:online', userId);
    } catch { /* non-fatal */ }
  }
}

export async function getOnlineUsers(): Promise<string[]> {
  const r = getRedis();
  if (r) {
    try {
      return await r.smembers('presence:online');
    } catch { /* fall through */ }
  }
  return [...localPresence.keys()];
}

export function presenceResetLocal(): void {
  localPresence.clear();
}
