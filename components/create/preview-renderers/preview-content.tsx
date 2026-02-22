import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/ui/type-badge";
import type { LinkType } from "@/lib/types";

interface PreviewContentProps {
  linkType: LinkType;
  loading: boolean;
  title: string | null;
  description: string | null;
}

export function PreviewContent({ linkType, loading, title, description }: PreviewContentProps) {
  return (
    <div className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <TypeBadge linkType={linkType} />
      </div>

      {loading && !title ? (
        <>
          <Skeleton className="mb-2 h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </>
      ) : (
        <>
          {title && (
            <h3 className="mb-1 text-base font-semibold leading-tight tracking-tight text-foreground line-clamp-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-[13px] leading-relaxed text-muted line-clamp-2">{description}</p>
          )}
        </>
      )}
    </div>
  );
}
