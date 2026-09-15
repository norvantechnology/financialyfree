/**
 * Redis / BullMQ connection helpers for Render and local Docker.
 * Placeholder hosts (YOUR_REDIS_HOST) must not block Nest bootstrap / port bind.
 */

const PLACEHOLDER = /YOUR_REDIS|CHANGE_ME|REDIS_HOST_HERE/i;

export function isRedisConfigured(): boolean {
  const url = process.env.REDIS_URL ?? '';
  if (url && !PLACEHOLDER.test(url) && !/^redis:\/\/$/i.test(url)) {
    try {
      const u = new URL(url);
      if (PLACEHOLDER.test(u.hostname) || u.hostname === 'YOUR_REDIS_HOST') return false;
      if (
        process.env.NODE_ENV === 'production' &&
        (u.hostname === 'localhost' || u.hostname === '127.0.0.1')
      ) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  const host = process.env.REDIS_HOST ?? '';
  if (!host || PLACEHOLDER.test(host)) return false;
  if (
    process.env.NODE_ENV === 'production' &&
    (host === 'localhost' || host === '127.0.0.1')
  ) {
    return false;
  }
  return true;
}

/** ioredis options for BullMQ — fail fast when Redis is down */
export function getRedisConnectionOptions():
  | { url: string; maxRetriesPerRequest: null; enableOfflineQueue: false; connectTimeout: number }
  | {
      host: string;
      port: number;
      password?: string;
      maxRetriesPerRequest: null;
      enableOfflineQueue: false;
      connectTimeout: number;
    } {
  const url = process.env.REDIS_URL;
  if (url && isRedisConfigured() && url.includes('://')) {
    return {
      url,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      connectTimeout: 5_000,
    };
  }

  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    connectTimeout: 5_000,
  };
}
