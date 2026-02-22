import { describe, it, expect } from "vitest";
import { isUrlSafe, sanitizeHref } from "@/lib/security";

describe("isUrlSafe", () => {
  it("allows https URLs to public hosts", () => {
    expect(isUrlSafe("https://example.com")).toBe(true);
    expect(isUrlSafe("https://www.youtube.com/watch?v=abc")).toBe(true);
  });

  it("allows http URLs to public hosts", () => {
    expect(isUrlSafe("http://example.com")).toBe(true);
  });

  it("blocks cloud metadata endpoint", () => {
    expect(isUrlSafe("http://169.254.169.254/latest/meta-data/")).toBe(false);
  });

  it("blocks localhost", () => {
    expect(isUrlSafe("http://localhost:3000")).toBe(false);
    expect(isUrlSafe("http://127.0.0.1")).toBe(false);
    expect(isUrlSafe("http://[::1]")).toBe(false);
  });

  it("blocks private IP ranges", () => {
    expect(isUrlSafe("http://10.0.0.1")).toBe(false);
    expect(isUrlSafe("http://192.168.1.1")).toBe(false);
    expect(isUrlSafe("http://172.16.0.1")).toBe(false);
  });

  it("blocks non-http protocols", () => {
    expect(isUrlSafe("ftp://example.com")).toBe(false);
    expect(isUrlSafe("file:///etc/passwd")).toBe(false);
    expect(isUrlSafe("javascript:alert(1)")).toBe(false);
  });

  it("blocks invalid URLs", () => {
    expect(isUrlSafe("not-a-url")).toBe(false);
    expect(isUrlSafe("")).toBe(false);
  });

  it("blocks 0.0.0.0", () => {
    expect(isUrlSafe("http://0.0.0.0")).toBe(false);
  });
});

describe("sanitizeHref", () => {
  it("allows http and https URLs", () => {
    expect(sanitizeHref("https://example.com")).toBe("https://example.com");
    expect(sanitizeHref("http://example.com")).toBe("http://example.com");
  });

  it("blocks javascript: URIs", () => {
    expect(sanitizeHref("javascript:alert(1)")).toBeNull();
    expect(sanitizeHref("JAVASCRIPT:alert(document.cookie)")).toBeNull();
  });

  it("blocks data: URIs", () => {
    expect(sanitizeHref("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("returns null for null/undefined/empty", () => {
    expect(sanitizeHref(null)).toBeNull();
    expect(sanitizeHref(undefined)).toBeNull();
    expect(sanitizeHref("")).toBeNull();
  });

  it("blocks vbscript: URIs", () => {
    expect(sanitizeHref("vbscript:MsgBox(1)")).toBeNull();
  });
});
