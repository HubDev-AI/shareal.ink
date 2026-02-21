import { AnalyticsEvent } from "@/lib/types";

export interface IAnalytics {
  track(event: AnalyticsEvent): void;
}
