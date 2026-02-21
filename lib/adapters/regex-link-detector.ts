import type { ILinkDetector } from "@/lib/interfaces";
import type { LinkDetectionResult, LinkType } from "@/lib/types";
import { linkTypeConfig } from "@/lib/config/link-types";

interface PatternRule {
  pattern: RegExp;
  linkType: LinkType;
}

const RULES: PatternRule[] = [
  // Places / Maps
  { pattern: /maps\.google\.|google\.\w+\/maps|goo\.gl\/maps|maps\.app\.goo\.gl/i, linkType: "google_maps" },
  { pattern: /yelp\.com/i, linkType: "google_maps" },
  { pattern: /opentable\.com/i, linkType: "google_maps" },
  { pattern: /resy\.com/i, linkType: "google_maps" },
  { pattern: /tripadvisor\.com/i, linkType: "google_maps" },

  // Video — YouTube
  { pattern: /youtube\.com|youtu\.be/i, linkType: "youtube" },

  // Video — TikTok
  { pattern: /tiktok\.com/i, linkType: "tiktok" },

  // Video — other (Vimeo → generic for now)
  { pattern: /vimeo\.com/i, linkType: "generic" },

  // Social — Instagram
  { pattern: /instagram\.com/i, linkType: "instagram" },

  // Social — X/Twitter
  { pattern: /^https?:\/\/(www\.)?(x|twitter)\.com/i, linkType: "x_twitter" },

  // Music — Spotify
  { pattern: /open\.spotify\.com/i, linkType: "spotify" },

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
