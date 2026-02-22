import { logger } from "./logger";

interface HealthDeps {
  checkRedis: () => boolean;
  checkDb: () => Promise<boolean>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let server: any = null;
const startTime = Date.now();

export function startHealthServer(port: number, deps: HealthDeps) {
  server = Bun.serve({
    port,
    fetch: async (req) => {
      const url = new URL(req.url);

      if (url.pathname === "/health") {
        const redisOk = deps.checkRedis();
        let dbOk = false;
        try {
          dbOk = await deps.checkDb();
        } catch {
          // db check failed
        }

        const healthy = redisOk && dbOk;
        return Response.json(
          {
            status: healthy ? "ok" : "degraded",
            redis: redisOk ? "connected" : "disconnected",
            db: dbOk ? "connected" : "disconnected",
            uptime: Math.floor((Date.now() - startTime) / 1000),
          },
          { status: healthy ? 200 : 503 },
        );
      }

      return new Response("Not Found", { status: 404 });
    },
  });

  logger.info("Health server started", { port });
  return server;
}

export function stopHealthServer() {
  if (server) {
    server.stop(true);
    server = null;
  }
}
