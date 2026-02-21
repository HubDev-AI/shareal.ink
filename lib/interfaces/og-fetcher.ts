import { OgMetadata } from "@/lib/types";

export interface IOgFetcher {
  fetch(url: string): Promise<OgMetadata>;
}
