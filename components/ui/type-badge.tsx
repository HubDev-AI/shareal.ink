import { cn } from "@/lib/utils";
import type { LinkType } from "@/lib/types";

const badgeConfig: Record<LinkType, { label: string; className: string }> = {
  restaurant: { label: "Restaurant", className: "bg-orange-100 text-orange-700" },
  video: { label: "Video", className: "bg-purple-100 text-purple-700" },
  event: { label: "Event", className: "bg-blue-100 text-blue-700" },
  generic: { label: "Link", className: "bg-gray-100 text-gray-600" },
};

interface TypeBadgeProps {
  linkType: LinkType;
  className?: string;
}

export function TypeBadge({ linkType, className }: TypeBadgeProps) {
  const config = badgeConfig[linkType];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
