import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const space = await prisma.space.findUnique({
      where: { token },
      include: { _count: { select: { responses: { where: { responseType: "yes" } } } } },
    });

    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    return NextResponse.json({
      token: space.token,
      originalUrl: space.originalUrl,
      title: space.title,
      description: space.description,
      imageUrl: space.imageUrl,
      linkType: space.linkType,
      intentType: space.intentType,
      primaryActionLabel: space.primaryActionLabel,
      extras: (space.extras as Record<string, string>) ?? null,
      createdAt: space.createdAt,
      responseCount: space._count.responses,
    });
  } catch (err) {
    console.error("[spaces/token] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
