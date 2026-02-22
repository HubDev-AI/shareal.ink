import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimiter } from "@/lib/container";
import { getClientIp } from "@/lib/get-client-ip";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const ip = getClientIp(request);
  const limit = await rateLimiter.check(`og-get:${ip}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const { jobId } = await params;

    const job = await prisma.ogJob.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: job.status,
      metadata: job.status === "completed"
        ? { title: job.title, description: job.description, imageUrl: job.imageUrl }
        : null,
      linkType: job.linkType,
      error: job.error,
    });
  } catch (err) {
    console.error("[og/jobId] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
