import { Worker } from "bullmq";
import { getRedisUrl } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { MetascraperOgFetcher } from "@/lib/adapters/metascraper-og-fetcher";

const QUEUE_NAME = "og-fetch";
const fetcher = new MetascraperOgFetcher();

const globalForWorker = globalThis as unknown as {
  ogWorker: Worker | undefined;
};

function ensureWorker(): Worker {
  if (globalForWorker.ogWorker) return globalForWorker.ogWorker;

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { ogJobId, url } = job.data as { ogJobId: string; url: string };

      const metadata = await fetcher.fetch(url);

      await prisma.ogJob.update({
        where: { id: ogJobId },
        data: {
          status: metadata.title ? "completed" : "failed",
          title: metadata.title,
          description: metadata.description,
          imageUrl: metadata.imageUrl,
          extras: metadata.extras ?? undefined,
          error: metadata.title ? null : "Failed to extract metadata",
          completedAt: new Date(),
        },
      });

      // If a Space already references this OgJob, enrich it
      await prisma.space.updateMany({
        where: { ogJobId },
        data: {
          title: metadata.title,
          description: metadata.description,
          imageUrl: metadata.imageUrl,
          extras: metadata.extras ?? undefined,
        },
      });

      return metadata;
    },
    {
      connection: { url: getRedisUrl() },
      concurrency: 5,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`OG fetch job ${job?.id} failed:`, err.message);
  });

  globalForWorker.ogWorker = worker;
  return worker;
}

export function getWorker(): Worker {
  return ensureWorker();
}
