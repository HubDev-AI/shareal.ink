import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryRateLimiter } from "@/lib/adapters/in-memory-rate-limiter";

describe("InMemoryRateLimiter", () => {
  let limiter: InMemoryRateLimiter;

  beforeEach(() => {
    limiter = new InMemoryRateLimiter({ maxRequests: 3, windowMs: 1000 });
  });

  it("allows requests under the limit", async () => {
    const result = await limiter.check("ip-1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks requests over the limit", async () => {
    await limiter.check("ip-1");
    await limiter.check("ip-1");
    await limiter.check("ip-1");
    const result = await limiter.check("ip-1");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks different keys independently", async () => {
    await limiter.check("ip-1");
    await limiter.check("ip-1");
    await limiter.check("ip-1");

    const result = await limiter.check("ip-2");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("resets after window expires", async () => {
    const shortLimiter = new InMemoryRateLimiter({ maxRequests: 1, windowMs: 50 });
    await shortLimiter.check("ip-1");
    const blocked = await shortLimiter.check("ip-1");
    expect(blocked.allowed).toBe(false);

    await new Promise((r) => setTimeout(r, 60));
    const allowed = await shortLimiter.check("ip-1");
    expect(allowed.allowed).toBe(true);
  });
});
