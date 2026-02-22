const PRIVATE_IP_PATTERNS = [
  /^127\./,                          // loopback
  /^10\./,                           // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./,     // 172.16.0.0/12
  /^192\.168\./,                     // 192.168.0.0/16
  /^169\.254\./,                     // link-local
  /^0\./,                            // 0.0.0.0/8
];

function isPrivateIp(ip: string): boolean {
  if (ip === "0.0.0.0" || ip === "::1" || ip === "::") return true;
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(ip));
}

/**
 * Validates that a URL is safe to fetch server-side.
 * Blocks private/reserved IPs, localhost, and non-http protocols.
 */
export function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname;

    // Block localhost
    if (hostname === "localhost" || hostname === "[::1]") return false;

    // Strip brackets from IPv6
    const bare = hostname.replace(/^\[|\]$/g, "");
    if (isPrivateIp(bare)) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that a URL is safe to render as an href attribute.
 * Only allows http: and https: protocols.
 */
export function sanitizeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}
