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

// Lazy accessor — validates and returns on first call, not at import time.
// Prevents build-time errors when Next.js pre-renders API routes.
function lazyRequired(name: string): { readonly value: string } {
  let cached: string | undefined;
  return {
    get value() {
      if (cached === undefined) cached = required(name);
      return cached;
    },
  };
}

// Required — validated lazily at first access (not import time) so
// Next.js can pre-render pages without runtime env vars present.
const _DATABASE_URL = lazyRequired("DATABASE_URL");
const _REDIS_URL = lazyRequired("REDIS_URL");

export function getDatabaseUrl(): string {
  return _DATABASE_URL.value;
}
export function getRedisUrl(): string {
  return _REDIS_URL.value;
}

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://shareal.ink";

// Optional — features degrade gracefully when unset
export const SENTRY_DSN = optional("SENTRY_DSN");
export const PLAUSIBLE_DOMAIN = optional("PLAUSIBLE_DOMAIN");
export const PLAUSIBLE_API_URL = optional("PLAUSIBLE_API_URL");
export const RATE_LIMIT_MAX = optionalInt("RATE_LIMIT_MAX", 20);
export const RATE_LIMIT_WINDOW_MS = optionalInt("RATE_LIMIT_WINDOW_MS", 60000);
export const LOG_LEVEL = optional("LOG_LEVEL", "info") as string;
