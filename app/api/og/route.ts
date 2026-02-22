import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queue, linkDetector, rateLimiter, analytics } from "@/lib/container";
import { parseInput } from "@/lib/validation";
import { linkTypeConfig } from "@/lib/config/link-types";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = await rateLimiter.check(`og:${ip}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body?.input || typeof body.input !== "string") {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  const parsed = parseInput(body.input);
  if (parsed.type === "empty") {
    return NextResponse.json({ error: "Input cannot be empty" }, { status: 400 });
  }
  if (parsed.type === "too_long") {
    return NextResponse.json({ error: `Input too long (max ${parsed.limit} characters)` }, { status: 400 });
  }

  const detection = parsed.type === "url"
    ? linkDetector.detect(parsed.value)
    : { linkType: "generic" as const, suggestedActionLabel: linkTypeConfig.generic.actionLabel };

  if (parsed.type === "text") {
    analytics.track({ name: "og_skipped", properties: { reason: "free_text" } });
    return NextResponse.json({
      jobId: null,
      linkType: detection.linkType,
      suggestedActionLabel: detection.suggestedActionLabel,
      title: parsed.value,
    });
  }

  try {
    const ogJob = await prisma.ogJob.create({
      data: {
        url: parsed.value,
        linkType: detection.linkType,
      },
    });

    await queue.enqueue("og-fetch", { ogJobId: ogJob.id, url: parsed.value });
    analytics.track({ name: "og_job_created", properties: { linkType: detection.linkType } });

    return NextResponse.json({
      jobId: ogJob.id,
      linkType: detection.linkType,
      suggestedActionLabel: detection.suggestedActionLabel,
      title: null,
    });
  } catch (err) {
    console.error("[og-route] Failed to create OG job:", err);
    return NextResponse.json(
      { error: "Failed to process link. Please try again." },
      { status: 500 }
    );
  }
}
