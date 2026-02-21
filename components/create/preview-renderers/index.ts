import type { ComponentType } from "react";
import type { PreviewRendererProps } from "./preview-renderer-props";
import type { LinkType } from "@/lib/types";
import { GenericPreview } from "./generic-preview";
import { YouTubePreview } from "./youtube-preview";
import { SpotifyPreview } from "./spotify-preview";
import { InstagramPreview } from "./instagram-preview";
import { TikTokPreview } from "./tiktok-preview";
import { GoogleMapsPreview } from "./google-maps-preview";
import { XTwitterPreview } from "./x-twitter-preview";
import { PdfPreview } from "./pdf-preview";
import { GoogleDocPreview } from "./google-doc-preview";
import { ImagePreview } from "./image-preview";

const registry: Partial<Record<LinkType, ComponentType<PreviewRendererProps>>> = {
  youtube: YouTubePreview,
  spotify: SpotifyPreview,
  instagram: InstagramPreview,
  tiktok: TikTokPreview,
  google_maps: GoogleMapsPreview,
  x_twitter: XTwitterPreview,
  pdf: PdfPreview,
  google_doc: GoogleDocPreview,
  image: ImagePreview,
};

export function getPreviewRenderer(linkType: LinkType): ComponentType<PreviewRendererProps> {
  return registry[linkType] ?? GenericPreview;
}
