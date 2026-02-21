import type { ILinkDetector } from "@/lib/interfaces";
import type { LinkDetectionResult, LinkType } from "@/lib/types";
import { linkTypeConfig } from "@/lib/config/link-types";

interface PatternRule {
  pattern: RegExp;
  linkType: LinkType;
}

const RULES: PatternRule[] = [
  // Restaurant / Places
  { pattern: /maps\.google\.|google\.\w+\/maps|goo\.gl\/maps/i, linkType: "restaurant" },
  { pattern: /yelp\.com/i, linkType: "restaurant" },
  { pattern: /opentable\.com/i, linkType: "restaurant" },
  { pattern: /resy\.com/i, linkType: "restaurant" },
  { pattern: /tripadvisor\.com/i, linkType: "restaurant" },

  // Video
  { pattern: /youtube\.com|youtu\.be/i, linkType: "video" },
  { pattern: /vimeo\.com/i, linkType: "video" },
  { pattern: /tiktok\.com/i, linkType: "video" },

  // Events
  { pattern: /eventbrite\.com/i, linkType: "event" },
  { pattern: /meetup\.com/i, linkType: "event" },
  { pattern: /lu\.ma/i, linkType: "event" },
];

export class RegexLinkDetector implements ILinkDetector {
  detect(url: string): LinkDetectionResult {
    for (const rule of RULES) {
      if (rule.pattern.test(url)) {
        return {
          linkType: rule.linkType,
          suggestedActionLabel: linkTypeConfig[rule.linkType].actionLabel,
        };
      }
    }
    return {
      linkType: "generic",
      suggestedActionLabel: linkTypeConfig.generic.actionLabel,
    };
  }
}
