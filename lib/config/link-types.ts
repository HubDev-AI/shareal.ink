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
  google_maps: {
    label: "Place",
    imageHeight: "h-52",
    imageOverlay: true,
    showAction: true,
    actionLabel: "I'm in!",
    badge: { bg: "bg-emerald-100", text: "text-emerald-700" },
  },
  youtube: {
    label: "Video",
    imageHeight: "aspect-video",
    imageOverlay: false,
    showAction: false,
    actionLabel: "I'll watch it",
    badge: { bg: "bg-red-100", text: "text-red-700" },
  },
  instagram: {
    label: "Instagram",
    imageHeight: "aspect-square",
    imageOverlay: false,
    showAction: false,
    actionLabel: "Interested",
    badge: { bg: "bg-pink-100", text: "text-pink-700" },
  },
  tiktok: {
    label: "TikTok",
    imageHeight: "aspect-[9/16]",
    imageOverlay: false,
    showAction: false,
    actionLabel: "Interested",
    badge: { bg: "bg-gray-100", text: "text-gray-700" },
  },
  spotify: {
    label: "Spotify",
    imageHeight: "h-20",
    imageOverlay: false,
    showAction: false,
    actionLabel: "Interested",
    badge: { bg: "bg-green-100", text: "text-green-700" },
  },
  x_twitter: {
    label: "Post",
    imageHeight: "h-52",
    imageOverlay: false,
    showAction: false,
    actionLabel: "Interested",
    badge: { bg: "bg-blue-100", text: "text-blue-700" },
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
