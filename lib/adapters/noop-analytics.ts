import type { IAnalytics } from "@/lib/interfaces";
import type { AnalyticsEvent } from "@/lib/types";

export class NoopAnalytics implements IAnalytics {
  track(_event: AnalyticsEvent): void {
    // No-op. Swap with PostHog/Mixpanel adapter when ready.
  }
}
