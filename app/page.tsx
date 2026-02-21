import { HomeContent } from "@/components/home-content";
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge";

export default function HomePage() {
  return (
    <main className="bg-aurora relative flex min-h-screen flex-col items-center justify-center px-4">
      <div className="aurora-grain" />
      <div className="aurora-calm" />
      <p className="absolute left-6 top-6 z-10 text-[10px] font-medium uppercase tracking-[0.25em] text-white/25">
        One link = One beautiful surface.
      </p>
      <ComingSoonBadge className="absolute right-2 top-4 z-10" />
      <HomeContent />
    </main>
  );
}
