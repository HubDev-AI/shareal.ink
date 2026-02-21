import { CreateForm } from "@/components/create/create-form";
import { Logo } from "@/components/layout/logo";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-8 text-center">
        <div className="space-y-2">
          <Logo className="text-2xl" />
          <p className="text-muted">Share a link. Make it make sense.</p>
        </div>
        <CreateForm />
      </div>
    </main>
  );
}
