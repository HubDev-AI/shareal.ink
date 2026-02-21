import { describe, it, expect } from "vitest";
import { createSpaceToken } from "@/lib/tokens";

describe("createSpaceToken", () => {
  it("returns a 7-character string", () => {
    const token = createSpaceToken();
    expect(token).toHaveLength(7);
  });

  it("uses only base62 characters", () => {
    const token = createSpaceToken();
    expect(token).toMatch(/^[A-Za-z0-9]+$/);
  });

  it("generates unique tokens", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => createSpaceToken()));
    expect(tokens.size).toBe(100);
  });
});
