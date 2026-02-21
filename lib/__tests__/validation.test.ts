import { describe, it, expect } from "vitest";
import { parseInput } from "@/lib/validation";

describe("parseInput", () => {
  it("parses a valid HTTP URL", () => {
    const result = parseInput("https://maps.google.com/place");
    expect(result.type).toBe("url");
    expect(result.value).toBe("https://maps.google.com/place");
  });

  it("parses a valid HTTP URL with whitespace", () => {
    const result = parseInput("  https://youtube.com/watch?v=abc  ");
    expect(result.type).toBe("url");
    expect(result.value).toBe("https://youtube.com/watch?v=abc");
  });

  it("parses free text", () => {
    const result = parseInput("Pizza tonight?");
    expect(result.type).toBe("text");
    expect(result.value).toBe("Pizza tonight?");
  });

  it("rejects empty input", () => {
    const result = parseInput("   ");
    expect(result.type).toBe("empty");
  });

  it("rejects non-http schemes", () => {
    const result = parseInput("javascript:alert(1)");
    expect(result.type).toBe("text");
  });

  it("rejects ftp schemes as text", () => {
    const result = parseInput("ftp://files.example.com");
    expect(result.type).toBe("text");
  });
});
