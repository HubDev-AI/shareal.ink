import type { ILinkDetector } from "@/lib/interfaces";
import type { LinkDetectionResult, LinkType } from "@/lib/types";

interface PatternRule {
  pattern: RegExp;
  linkType: LinkType;
  actionLabel: string;
}

const RULES: PatternRule[] = [
  // Restaurant / Places
  { pattern: /maps\.google\.|google\.\w+\/maps|goo\.gl\/maps/i, linkType: "restaurant", actionLabel: "I'm in!" },
  { pattern: /yelp\.com/i, linkType: "restaurant", actionLabel: "I'm in!" },
  { pattern: /opentable\.com/i, linkType: "restaurant", actionLabel: "I'm in!" },
  { pattern: /resy\.com/i, linkType: "restaurant", actionLabel: "I'm in!" },
  { pattern: /tripadvisor\.com/i, linkType: "restaurant", actionLabel: "I'm in!" },

  // Video
  { pattern: /youtube\.com|youtu\.be/i, linkType: "video", actionLabel: "I'll watch it" },
  { pattern: /vimeo\.com/i, linkType: "video", actionLabel: "I'll watch it" },
  { pattern: /tiktok\.com/i, linkType: "video", actionLabel: "I'll watch it" },

  // Events
  { pattern: /eventbrite\.com/i, linkType: "event", actionLabel: "I'm in!" },
  { pattern: /meetup\.com/i, linkType: "event", actionLabel: "I'm in!" },
  { pattern: /lu\.ma/i, linkType: "event", actionLabel: "I'm in!" },
];

export class RegexLinkDetector implements ILinkDetector {
  detect(url: string): LinkDetectionResult {
    for (const rule of RULES) {
      if (rule.pattern.test(url)) {
        return { linkType: rule.linkType, suggestedActionLabel: rule.actionLabel };
      }
    }
    return { linkType: "generic", suggestedActionLabel: "Interested" };
  }
}
