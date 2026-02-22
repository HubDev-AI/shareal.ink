"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary]", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#040c1f] px-4 text-center">
      <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
      <p className="mt-3 max-w-md text-sm text-white/50">
        An unexpected error occurred. Please try again.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-[#040c1f] transition-colors hover:bg-white/90"
        >
          Try again
        </button>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Error boundary: router may be broken */}
        <a
          href="/"
          className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
        >
          Go home
        </a>
      </div>
    </main>
  );
}
