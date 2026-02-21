// Redis connection URL — used by BullMQ directly (it manages its own ioredis instance)
export function getRedisUrl(): string {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL environment variable is required");
  }
  return url;
}
