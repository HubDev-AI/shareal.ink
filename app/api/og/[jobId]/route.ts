import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
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
