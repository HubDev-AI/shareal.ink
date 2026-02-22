export type LinkType = "google_maps" | "youtube" | "instagram" | "tiktok" | "spotify" | "x_twitter" | "event" | "pdf" | "google_doc" | "image" | "generic";
export type IntentType = "meet" | "vote" | "share";
export interface OgMetadata {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  extras?: Record<string, string> | null;
}

export interface LinkDetectionResult {
  linkType: LinkType;
  suggestedActionLabel: string;
}

export interface SpaceData {
  token: string;
  originalUrl: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  linkType: LinkType;
  intentType: IntentType;
  primaryActionLabel: string;
  intentText: string | null;
  extras: Record<string, string> | null;
  createdAt: Date;
  responseCount: number;
}

export interface AuthUser {
  userId: string;
  isAuthenticated: boolean;
}

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
}
