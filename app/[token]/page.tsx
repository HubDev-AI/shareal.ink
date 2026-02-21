import Link from "next/link";
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
    <main className="relative flex min-h-screen flex-col items-center px-4 py-12">
      {/* Top-left branding — clickable to home */}
      <Link
        href="/"
        className="absolute left-6 top-6 text-[10px] font-medium uppercase tracking-[0.25em] text-muted/40 transition-colors hover:text-muted/70"
      >
        One link = One beautiful surface.
      </Link>

      <div className="flex flex-1 items-start justify-center pt-8">
        <SurfaceCard space={spaceData} />
      </div>

      {/* Bottom branding strip */}
      <footer className="mt-auto pt-8 pb-6">
        <Link href="/" className="group flex items-center gap-1.5">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-blue-400/30 transition-all group-hover:w-12 group-hover:to-blue-400/50" />
          <span className="text-[11px] font-medium tracking-wide text-muted/35 transition-colors group-hover:text-muted/60">
            shareal<span className="text-blue-400/50 group-hover:text-blue-400/70">.ink</span>
          </span>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-blue-400/30 transition-all group-hover:w-12 group-hover:to-blue-400/50" />
        </Link>
      </footer>
    </main>
  );
}
