import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSpaceToken } from "@/lib/tokens";
import { rateLimiter, auth, analytics } from "@/lib/container";
import { sanitizeHref } from "@/lib/security";
import { getClientIp } from "@/lib/get-client-ip";
import type { LinkType, IntentType } from "@/lib/types";

const VALID_LINK_TYPES: LinkType[] = [
  "google_maps", "youtube", "instagram", "tiktok", "spotify",
  "x_twitter", "event", "pdf", "google_doc", "image", "generic",
];
const VALID_INTENT_TYPES: IntentType[] = ["meet", "vote", "share"];
const MAX_TITLE = 256;
const MAX_DESCRIPTION = 2000;
const MAX_INTENT_TEXT = 2000;
const MAX_ACTION_LABEL = 100;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = await rateLimiter.check(`spaces:${ip}`);
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

  const { url, jobId, title, description, linkType, primaryActionLabel, intentText, intentType } = body;

  if (!linkType || !primaryActionLabel) {
    return NextResponse.json({ error: "linkType and primaryActionLabel are required" }, { status: 400 });
  }

  if (url && !sanitizeHref(url)) {
    return NextResponse.json(
      { error: "URL must use http or https protocol" },
      { status: 400 }
    );
  }

  if (!VALID_LINK_TYPES.includes(linkType)) {
    return NextResponse.json({ error: "Invalid linkType" }, { status: 400 });
  }

  if (intentType && !VALID_INTENT_TYPES.includes(intentType)) {
    return NextResponse.json({ error: "Invalid intentType" }, { status: 400 });
  }

  if (title && typeof title === "string" && title.length > MAX_TITLE) {
    return NextResponse.json({ error: `Title too long (max ${MAX_TITLE})` }, { status: 400 });
  }

  if (description && typeof description === "string" && description.length > MAX_DESCRIPTION) {
    return NextResponse.json({ error: `Description too long (max ${MAX_DESCRIPTION})` }, { status: 400 });
  }

  if (intentText && typeof intentText === "string" && intentText.length > MAX_INTENT_TEXT) {
    return NextResponse.json({ error: `Intent text too long (max ${MAX_INTENT_TEXT})` }, { status: 400 });
  }

  if (primaryActionLabel.length > MAX_ACTION_LABEL) {
    return NextResponse.json({ error: `Action label too long (max ${MAX_ACTION_LABEL})` }, { status: 400 });
  }

  let ogTitle = title;
  let ogDescription = description;
  let ogImageUrl: string | null = null;
  let ogExtras: unknown = null;

  if (jobId) {
    const ogJob = await prisma.ogJob.findUnique({ where: { id: jobId } });
    if (ogJob?.status === "completed") {
      ogTitle = ogTitle ?? ogJob.title;
      ogDescription = ogDescription ?? ogJob.description;
      ogImageUrl = ogJob.imageUrl;
      ogExtras = ogJob.extras;
    }
  }

  const user = await auth.getCurrentUser();

  let space;
  for (let attempt = 0; attempt < 3; attempt++) {
    const token = createSpaceToken();
    try {
      space = await prisma.space.create({
        data: {
          token,
          originalUrl: url || null,
          title: ogTitle || null,
          description: ogDescription || null,
          imageUrl: ogImageUrl,
          linkType,
          primaryActionLabel,
          intentType: intentType || "meet",
          intentText: intentText || null,
          extras: ogExtras ?? undefined,
          ogJobId: jobId || null,
          creatorUserId: user.isAuthenticated ? user.userId : null,
        },
      });
      break;
    } catch (e: unknown) {
      if (attempt === 2 || !(e instanceof Error) || !e.message.includes("Unique constraint")) {
        throw e;
      }
    }
  }

  if (!space) {
    return NextResponse.json({ error: "Failed to generate unique token" }, { status: 500 });
  }

  analytics.track({ name: "space_created", properties: { linkType, hasOg: !!ogTitle } });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://shareal.ink";
  return NextResponse.json({ token: space.token, url: `${appUrl}/${space.token}` });
}
