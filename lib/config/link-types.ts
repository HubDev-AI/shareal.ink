import type { LinkType } from "@/lib/types";

/** Display and behavior settings per link type */
export interface LinkTypeConfig {
  /** Human-readable label (e.g. badge text) */
  label: string;
  /** Tailwind class for image container height */
  imageHeight: string;
  /** Apply blue tint overlay on hero image */
  imageOverlay: boolean;
  /** Show RSVP / action button on surface page */
  showAction: boolean;
  /** Default action button text */
  actionLabel: string;
  /** Badge colors for preview card */
  badge: { bg: string; text: string };
}

export const linkTypeConfig: Record<LinkType, LinkTypeConfig> = {
  restaurant: {
    label: "Restaurant",
    imageHeight: "h-52",
    imageOverlay: true,
    showAction: true,
    actionLabel: "I'm in!",
    badge: { bg: "bg-orange-100", text: "text-orange-700" },
  },
  video: {
    label: "Video",
    imageHeight: "aspect-video",
    imageOverlay: false,
    showAction: false,
    actionLabel: "I'll watch it",
    badge: { bg: "bg-purple-100", text: "text-purple-700" },
  },
  event: {
    label: "Event",
    imageHeight: "h-52",
    imageOverlay: false,
    showAction: true,
    actionLabel: "I'm in!",
    badge: { bg: "bg-blue-100", text: "text-blue-700" },
  },
  generic: {
    label: "Link",
    imageHeight: "h-52",
    imageOverlay: true,
    showAction: false,
    actionLabel: "Interested",
    badge: { bg: "bg-gray-100", text: "text-gray-600" },
  },
};
