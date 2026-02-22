import { ExternalLink } from "lucide-react";
import { sanitizeHref } from "@/lib/security";

interface SecondaryActionsProps {
  originalUrl: string | null;
}

export function SecondaryActions({ originalUrl }: SecondaryActionsProps) {
  const safeUrl = sanitizeHref(originalUrl);
  if (!safeUrl) return null;

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-1.5 text-[13px] text-white/40 transition-colors hover:text-white/60"
    >
      <span>Open original</span>
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}
