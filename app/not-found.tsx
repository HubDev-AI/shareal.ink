import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo className="mb-6 text-2xl" />
      <h1 className="mb-2 text-xl font-semibold text-foreground">This link doesn&apos;t exist</h1>
      <p className="mb-6 text-muted">It may have been removed, or the URL might be wrong.</p>
      <Link href="/">
        <Button>Create your own</Button>
      </Link>
    </main>
  );
}
