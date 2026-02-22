import "dotenv/config";
import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { MetascraperOgFetcher } from "@/lib/adapters/metascraper-og-fetcher";

const QUEUE_NAME = "og-fetch";

// Standalone Prisma client (no Next.js Proxy wrapper)
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Reuse the same OG fetcher adapter (includes site-specific extractors)
const fetcher = new MetascraperOgFetcher();

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error("REDIS_URL environment variable is required");
  process.exit(1);
}

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { ogJobId, url } = job.data as { ogJobId: string; url: string };

    try {
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
    } catch (err) {
      await prisma.ogJob.update({
        where: { id: ogJobId },
        data: {
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
          completedAt: new Date(),
        },
      }).catch(() => {});

      throw err;
    }
  },
  {
    connection: { url: redisUrl },
    concurrency: 5,
  }
);

worker.on("failed", (job, err) => {
  console.error(`OG fetch job ${job?.id} failed:`, err.message);
});

worker.on("ready", () => {
  console.log("Worker ready, listening for jobs...");
});

// Graceful shutdown
function shutdown() {
  console.log("Shutting down worker...");
  worker.close().then(() => {
    pool.end().then(() => process.exit(0));
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log(`Worker started (queue: ${QUEUE_NAME}, redis: ${redisUrl.replace(/\/\/.*@/, "//***@")})`);
