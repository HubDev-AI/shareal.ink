import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimiter, analytics } from "@/lib/container";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = await rateLimiter.check(`respond:${ip}:${token}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    );
  }

  const space = await prisma.space.findUnique({ where: { token } });
  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const responseType = body?.responseType === "no" ? "no" : "yes";

  await prisma.response.create({
    data: { spaceId: space.id, responseType },
  });

  const [yesCount, noCount] = await Promise.all([
    prisma.response.count({ where: { spaceId: space.id, responseType: "yes" } }),
    prisma.response.count({ where: { spaceId: space.id, responseType: "no" } }),
  ]);

  analytics.track({ name: "space_responded", properties: { token, responseType } });

  return NextResponse.json({ count: yesCount, yesCount, noCount });
}
