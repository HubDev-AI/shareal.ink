import { NextRequest } from "next/server";

/**
 * Extract client IP from request headers.
 * On Vercel, x-real-ip is set by the platform and cannot be spoofed.
 * Falls back to first IP in x-forwarded-for, then "unknown".
 */
export function getClientIp(request: NextRequest): string {
  // Vercel sets x-real-ip — not spoofable
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  // Fallback: first IP in x-forwarded-for (client IP)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }

  return "unknown";
}
