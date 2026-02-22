import "dotenv/config";
import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { MetascraperOgFetcher } from "@/lib/adapters/metascraper-og-fetcher";
import { logger } from "./logger";
import { startHealthServer, stopHealthServer } from "./health";

const QUEUE_NAME = "og-fetch";
const DRAIN_TIMEOUT = 30_000;

// --- Database ---
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- OG Fetcher (shared adapter with site-specific extractors) ---
const fetcher = new MetascraperOgFetcher();

// --- Redis URL ---
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  logger.error("REDIS_URL environment variable is required");
  process.exit(1);
}

// --- Stats ---
let jobsProcessed = 0;
let jobsFailed = 0;
let totalDurationMs = 0;

// --- Worker ---
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { ogJobId, url } = job.data as { ogJobId: string; url: string };
    const start = Date.now();

    try {
      const metadata = await fetcher.fetch(url);
      const duration = Date.now() - start;

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

      jobsProcessed++;
      totalDurationMs += duration;
      logger.info("Job completed", { jobId: job.id, ogJobId, duration, title: metadata.title });

      return metadata;
    } catch (err) {
      const duration = Date.now() - start;
      jobsFailed++;
      totalDurationMs += duration;

      await prisma.ogJob.update({
        where: { id: ogJobId },
        data: {
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
          completedAt: new Date(),
        },
      }).catch(() => {});

      logger.error("Job failed", {
        jobId: job.id,
        ogJobId,
        duration,
        error: err instanceof Error ? err.message : "Unknown error",
      });

      throw err;
    }
  },
  {
    connection: { url: redisUrl },
    concurrency: 5,
  },
);

worker.on("ready", () => {
  logger.info("Worker ready", { queue: QUEUE_NAME });
});

// --- Health server ---
const healthPort = parseInt(process.env.PORT || "8080", 10);

startHealthServer(healthPort, {
  checkRedis: () => !worker.closing,
  checkDb: async () => {
    const client = await pool.connect();
    client.release();
    return true;
  },
});

// --- Periodic stats ---
const statsInterval = setInterval(() => {
  if (jobsProcessed > 0 || jobsFailed > 0) {
    const avgMs = jobsProcessed > 0 ? Math.round(totalDurationMs / (jobsProcessed + jobsFailed)) : 0;
    logger.info("Stats", { jobsProcessed, jobsFailed, avgDurationMs: avgMs });
  }
}, 60_000);

// --- Graceful shutdown ---
let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info("Shutdown started", { signal, inFlight: worker.running });

  clearInterval(statsInterval);
  stopHealthServer();

  // Drain: stop taking new jobs, wait for in-flight to finish
  const drainTimer = setTimeout(() => {
    logger.warn("Drain timeout reached, forcing exit");
    process.exit(1);
  }, DRAIN_TIMEOUT);

  try {
    await worker.close();
    await pool.end();
    clearTimeout(drainTimer);
    logger.info("Shutdown complete");
    process.exit(0);
  } catch (err) {
    logger.error("Shutdown error", { error: err instanceof Error ? err.message : "Unknown" });
    clearTimeout(drainTimer);
    process.exit(1);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

logger.info("Worker started", {
  queue: QUEUE_NAME,
  redis: redisUrl.replace(/\/\/.*@/, "//***@"),
  healthPort,
});
