import { Queue } from "bullmq";
import type { IQueue } from "@/lib/interfaces";
import { getRedisUrl } from "@/lib/redis";

const QUEUE_NAME = "og-fetch";

const globalForQueue = globalThis as unknown as {
  bullmqQueue: Queue | undefined;
};

function getQueue(): Queue {
  if (!globalForQueue.bullmqQueue) {
    globalForQueue.bullmqQueue = new Queue(QUEUE_NAME, {
      connection: { url: getRedisUrl() },
    });
  }
  return globalForQueue.bullmqQueue;
}

export class BullMQAdapter implements IQueue {
  async enqueue(jobName: string, data: Record<string, unknown>): Promise<string> {
    const queue = getQueue();
    const job = await queue.add(jobName, data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    });
    return job.id!;
  }

  async close(): Promise<void> {
    const queue = getQueue();
    await queue.close();
  }
}
