export type LinkType = "google_maps" | "youtube" | "instagram" | "tiktok" | "spotify" | "x_twitter" | "event" | "generic";
export type IntentType = "meet" | "vote" | "share";
export type OgJobStatus = "processing" | "completed" | "failed";
export type ResponseType = "yes" | "no";

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

export interface SpaceCreateInput {
  url: string | null;
  title: string | null;
  description: string | null;
  linkType: LinkType;
  primaryActionLabel: string;
  ogJobId: string | null;
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
  extras: Record<string, string> | null;
  createdAt: Date;
  responseCount: number;
}

export interface OgJobData {
  id: string;
  url: string;
  status: OgJobStatus;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  linkType: LinkType;
  extras: Record<string, string> | null;
  error: string | null;
}

export interface AuthUser {
  userId: string;
  isAuthenticated: boolean;
}

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
}
