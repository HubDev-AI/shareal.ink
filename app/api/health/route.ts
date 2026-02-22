import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRedisUrl } from "@/lib/redis";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = "ok";
  } catch (err) {
    console.error("[health] DB check failed:", err);
    checks.db = "error";
  }

  // Redis check — verify URL is configured
  try {
    getRedisUrl();
    checks.redis = "ok";
  } catch {
    checks.redis = "error";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    { status: allOk ? "ok" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
