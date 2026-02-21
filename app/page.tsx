import { CreateForm } from "@/components/create/create-form";
import { NyraHero } from "@/components/nyra/nyra-hero";

export default function HomePage() {
  return (
    <main className="bg-aurora relative flex min-h-screen flex-col items-center justify-center px-4">
      <div className="aurora-grain" />
      <div className="aurora-calm" />
      <p className="absolute left-6 top-6 z-10 text-[10px] font-medium uppercase tracking-[0.25em] text-white/25">
        One link = One beautiful surface.
      </p>
      <div className="relative z-10 w-full max-w-lg space-y-8 text-center">
        <div className="flex justify-center">
          <NyraHero />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            shareal<span className="text-cyan-300">.ink</span>
          </h1>
          <p className="text-sm text-white/60">Share a link. Make it make sense.</p>
        </div>
        <CreateForm />
      </div>
    </main>
  );
}
