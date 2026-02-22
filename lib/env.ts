function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, defaultValue?: string): string | undefined {
  return process.env[name] ?? defaultValue;
}

function optionalInt(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number, got: ${value}`);
  }
  return parsed;
}

// Required — app crashes at startup if missing
export const DATABASE_URL = required("DATABASE_URL");
export const REDIS_URL = required("REDIS_URL");
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://shareal.ink";

// Optional — features degrade gracefully when unset
export const SENTRY_DSN = optional("SENTRY_DSN");
export const PLAUSIBLE_DOMAIN = optional("PLAUSIBLE_DOMAIN");
export const PLAUSIBLE_API_URL = optional("PLAUSIBLE_API_URL");
export const UPSTASH_REDIS_REST_URL = optional("UPSTASH_REDIS_REST_URL");
export const UPSTASH_REDIS_REST_TOKEN = optional("UPSTASH_REDIS_REST_TOKEN");
export const RATE_LIMIT_MAX = optionalInt("RATE_LIMIT_MAX", 20);
export const RATE_LIMIT_WINDOW_MS = optionalInt("RATE_LIMIT_WINDOW_MS", 60000);
export const LOG_LEVEL = optional("LOG_LEVEL", "info") as string;
