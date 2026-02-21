import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSpaceToken } from "@/lib/tokens";
import { rateLimiter, auth, analytics } from "@/lib/container";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = await rateLimiter.check(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { url, jobId, title, description, linkType, primaryActionLabel } = body;

  if (!linkType || !primaryActionLabel) {
    return NextResponse.json({ error: "linkType and primaryActionLabel are required" }, { status: 400 });
  }

  let ogTitle = title;
  let ogDescription = description;
  let ogImageUrl: string | null = null;

  if (jobId) {
    const ogJob = await prisma.ogJob.findUnique({ where: { id: jobId } });
    if (ogJob?.status === "completed") {
      ogTitle = ogTitle ?? ogJob.title;
      ogDescription = ogDescription ?? ogJob.description;
      ogImageUrl = ogJob.imageUrl;
    }
  }

  const user = await auth.getCurrentUser();
  const token = createSpaceToken();

  const space = await prisma.space.create({
    data: {
      token,
      originalUrl: url || null,
      title: ogTitle || null,
      description: ogDescription || null,
      imageUrl: ogImageUrl,
      linkType,
      primaryActionLabel,
      ogJobId: jobId || null,
      creatorUserId: user.isAuthenticated ? user.userId : null,
    },
  });

  analytics.track({ name: "space_created", properties: { linkType, hasOg: !!ogTitle } });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://shareal.ink";
  return NextResponse.json({ token: space.token, url: `${appUrl}/${space.token}` });
}
