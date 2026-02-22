import type { IAnalytics } from "@/lib/interfaces";
import type { AnalyticsEvent } from "@/lib/types";

export class PlausibleAnalytics implements IAnalytics {
  private domain: string;
  private apiUrl: string;

  constructor(domain: string, apiUrl = "https://plausible.io/api/event") {
    this.domain = domain;
    this.apiUrl = apiUrl;
  }

  track(event: AnalyticsEvent): void {
    fetch(this.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: event.name,
        url: `https://${this.domain}`,
        domain: this.domain,
        props: event.properties ?? {},
      }),
    }).catch((err) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[plausible]", err instanceof Error ? err.message : err);
      }
    });
  }
}
