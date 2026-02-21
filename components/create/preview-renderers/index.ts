import type { ComponentType } from "react";
import type { PreviewRendererProps } from "./preview-renderer-props";
import type { LinkType } from "@/lib/types";
import { GenericPreview } from "./generic-preview";

const registry: Partial<Record<LinkType, ComponentType<PreviewRendererProps>>> = {};

export function getPreviewRenderer(linkType: LinkType): ComponentType<PreviewRendererProps> {
  return registry[linkType] ?? GenericPreview;
}
