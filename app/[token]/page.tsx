import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SurfaceCard } from "@/components/surface/surface-card";
import { defaultTheme } from "@/lib/config/themes";
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
    intentText: space.intentText,
    extras: (space.extras as Record<string, string>) ?? null,
    createdAt: space.createdAt,
    responseCount: space._count.responses,
  };

  const theme = defaultTheme;

  return (
    <main className={`${theme.background} relative flex min-h-screen flex-col items-center px-4 py-12`}>
      {theme.grain && <div className="aurora-grain" />}

      {/* Top-left branding — clickable to home */}
      <Link
        href="/"
        className="absolute left-6 top-6 z-10 text-[10px] font-medium uppercase tracking-[0.25em] text-white/25 transition-colors hover:text-white/50"
      >
        One link = One beautiful surface.
      </Link>

      <div className="relative z-10 flex flex-1 items-center justify-center">
        <SurfaceCard space={spaceData} />
      </div>

      {/* Bottom branding */}
      <footer className="relative z-10 mt-auto pt-8 pb-6">
        <Link href="/" className="group flex items-center gap-2">
          <div className="h-px w-10 bg-gradient-to-r from-transparent to-cyan-400/30 transition-all group-hover:w-14 group-hover:to-cyan-400/50" />
          <span className="text-sm font-medium tracking-wider text-white/30 transition-colors group-hover:text-white/55">
            shareal<span className="text-cyan-300/50 group-hover:text-cyan-300/70">.ink</span>
          </span>
          <div className="h-px w-10 bg-gradient-to-l from-transparent to-cyan-400/30 transition-all group-hover:w-14 group-hover:to-cyan-400/50" />
        </Link>
      </footer>
    </main>
  );
}
