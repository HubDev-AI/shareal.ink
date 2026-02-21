import type { IntentType, LinkType } from "@/lib/types";
import { linkTypeConfig } from "@/lib/config/link-types";

const TIME_PATTERNS = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tonight|tomorrow|today|morning|noon|evening|afternoon|am|pm|\d{1,2}:\d{2}|\d{1,2}\s*(am|pm))\b/i;

export function inferIntentType(text: string, linkType: LinkType): IntentType {
  const trimmed = text.trim();

  if (!trimmed) {
    return linkTypeConfig[linkType].defaultIntentType;
  }

  // Question mark → vote (highest priority)
  if (trimmed.includes("?")) {
    return "vote";
  }

  // Time-like patterns → meet
  if (TIME_PATTERNS.test(trimmed)) {
    return "meet";
  }

  // Fall back to link type default
  return linkTypeConfig[linkType].defaultIntentType;
}
