import type { LinkType, OgMetadata } from "@/lib/types";

export interface PreviewRendererProps {
  linkType: LinkType;
  metadata: OgMetadata | null;
  loading: boolean;
  title: string | null;
  originalUrl: string | null;
}
