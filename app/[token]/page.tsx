import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SurfaceCard } from "@/components/surface/surface-card";
import type { Metadata } from "next";
import type { SpaceData, LinkType, IntentType } from "@/lib/types";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const space = await prisma.space.findUnique({ where: { token } });

  if (!space) return { title: "Not found — shareal.ink" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://shareal.ink";

  return {
    title: space.title ? `${space.title} — shareal.ink` : "shareal.ink",
    description: space.description ?? "Shared on shareal.ink",
    openGraph: {
      title: space.title ?? "shareal.ink",
      description: space.description ?? "Shared on shareal.ink",
      images: space.imageUrl ? [{ url: space.imageUrl }] : [],
      url: `${appUrl}/${token}`,
      type: "website",
    },
    twitter: {
      card: space.imageUrl ? "summary_large_image" : "summary",
      title: space.title ?? "shareal.ink",
      description: space.description ?? "Shared on shareal.ink",
    },
  };
}

export default async function SurfacePage({ params }: PageProps) {
  const { token } = await params;

  const space = await prisma.space.findUnique({
    where: { token },
    include: { _count: { select: { responses: { where: { responseType: "yes" } } } } },
  });

  if (!space) notFound();

  const spaceData: SpaceData = {
    token: space.token,
    originalUrl: space.originalUrl,
    title: space.title,
    description: space.description,
    imageUrl: space.imageUrl,
    linkType: space.linkType as LinkType,
    intentType: space.intentType as IntentType,
    primaryActionLabel: space.primaryActionLabel,
    createdAt: space.createdAt,
    responseCount: space._count.responses,
  };

  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-12">
      <SurfaceCard space={spaceData} />
    </main>
  );
}
