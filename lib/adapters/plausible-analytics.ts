import type { IAnalytics } from "@/lib/interfaces";
import type { AnalyticsEvent } from "@/lib/types";

export class PlausibleAnalytics implements IAnalytics {
  private domain: string;
  private apiUrl = "https://plausible.io/api/event";

  constructor(domain: string) {
    this.domain = domain;
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
    }).catch(() => {});
  }
}
