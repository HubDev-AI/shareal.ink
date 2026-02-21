import type { ComponentType } from "react";
import type { RendererProps } from "./renderer-props";
import type { LinkType } from "@/lib/types";
import { GenericRenderer } from "./generic-renderer";
import { GoogleMapsRenderer } from "./google-maps-renderer";
import { YouTubeRenderer } from "./youtube-renderer";
import { InstagramRenderer } from "./instagram-renderer";
import { TikTokRenderer } from "./tiktok-renderer";
import { SpotifyRenderer } from "./spotify-renderer";
import { XTwitterRenderer } from "./x-twitter-renderer";

const registry: Record<LinkType, ComponentType<RendererProps>> = {
  google_maps: GoogleMapsRenderer,
  youtube: YouTubeRenderer,
  instagram: InstagramRenderer,
  tiktok: TikTokRenderer,
  spotify: SpotifyRenderer,
  x_twitter: XTwitterRenderer,
  event: GenericRenderer,
  generic: GenericRenderer,
};

export function getRenderer(linkType: LinkType): ComponentType<RendererProps> {
  return registry[linkType] ?? registry.generic;
}
