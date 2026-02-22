import "dotenv/config";
import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

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

// Dynamic import metascraper (ESM modules)
async function createScraper() {
  const metascraper = (await import("metascraper")).default;
  const title = (await import("metascraper-title")).default;
  const description = (await import("metascraper-description")).default;
  const image = (await import("metascraper-image")).default;
  return metascraper([title(), description(), image()]);
}

// SSRF protection (standalone copy — worker runs outside Next.js)
const PRIVATE_IP_PATTERNS = [
  /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
  /^169\.254\./, /^0\./,
];

function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname;
    if (hostname === "localhost" || hostname === "[::1]") return false;
    const bare = hostname.replace(/^\[|\]$/g, "");
    if (bare === "0.0.0.0" || bare === "::1" || bare === "::") return false;
    return !PRIVATE_IP_PATTERNS.some((p) => p.test(bare));
  } catch {
    return false;
  }
}

async function fetchOgMetadata(url: string) {
  if (!isUrlSafe(url)) {
    return { title: null, description: null, imageUrl: null };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SharealBot/1.0; +https://shareal.ink)" },
    });
    const html = await response.text();
    const scraper = await createScraper();
    const raw = await scraper({ html, url: response.url });
    return {
      title: raw.title || null,
      description: raw.description || null,
      imageUrl: raw.image || null,
    };
  } catch {
    try {
      const hostname = new URL(url).hostname.replace("www.", "");
      return { title: hostname, description: null, imageUrl: null };
    } catch {
      return { title: null, description: null, imageUrl: null };
    }
  } finally {
    clearTimeout(timeout);
  }
}

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
      const metadata = await fetchOgMetadata(url);

      await prisma.ogJob.update({
        where: { id: ogJobId },
        data: {
          status: metadata.title ? "completed" : "failed",
          title: metadata.title,
          description: metadata.description,
          imageUrl: metadata.imageUrl,
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
