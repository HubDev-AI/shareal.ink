import { REDIS_URL } from "@/lib/env";

// Redis connection URL — used by BullMQ directly (it manages its own ioredis instance)
export function getRedisUrl(): string {
  return REDIS_URL;
}
