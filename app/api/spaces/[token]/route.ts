import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
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
    createdAt: space.createdAt,
    responseCount: space._count.responses,
  });
}
