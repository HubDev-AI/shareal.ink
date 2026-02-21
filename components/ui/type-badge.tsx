import { cn } from "@/lib/utils";
import { linkTypeConfig } from "@/lib/config/link-types";
import type { LinkType } from "@/lib/types";

interface TypeBadgeProps {
  linkType: LinkType;
  className?: string;
}

export function TypeBadge({ linkType, className }: TypeBadgeProps) {
  const config = linkTypeConfig[linkType];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.badge.bg,
        config.badge.text,
        className
      )}
    >
      {config.label}
    </span>
  );
}
