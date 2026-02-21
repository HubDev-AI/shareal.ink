import { describe, it, expect } from "vitest";
import { parseInput, MAX_URL_LENGTH, MAX_TEXT_LENGTH } from "@/lib/validation";

describe("parseInput", () => {
  it("parses a valid HTTP URL", () => {
    const result = parseInput("https://maps.google.com/place");
    expect(result.type).toBe("url");
    if (result.type === "url") expect(result.value).toBe("https://maps.google.com/place");
  });

  it("parses a valid HTTP URL with whitespace", () => {
    const result = parseInput("  https://youtube.com/watch?v=abc  ");
    expect(result.type).toBe("url");
    if (result.type === "url") expect(result.value).toBe("https://youtube.com/watch?v=abc");
  });

  it("parses free text", () => {
    const result = parseInput("Pizza tonight?");
    expect(result.type).toBe("text");
    if (result.type === "text") expect(result.value).toBe("Pizza tonight?");
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

  it("rejects URLs exceeding max length", () => {
    const longUrl = "https://example.com/" + "a".repeat(MAX_URL_LENGTH);
    const result = parseInput(longUrl);
    expect(result.type).toBe("too_long");
    if (result.type === "too_long") expect(result.limit).toBe(MAX_URL_LENGTH);
  });

  it("rejects text exceeding max length", () => {
    const longText = "a".repeat(MAX_TEXT_LENGTH + 1);
    const result = parseInput(longText);
    expect(result.type).toBe("too_long");
    if (result.type === "too_long") expect(result.limit).toBe(MAX_TEXT_LENGTH);
  });

  it("accepts text at exactly max length", () => {
    const text = "a".repeat(MAX_TEXT_LENGTH);
    const result = parseInput(text);
    expect(result.type).toBe("text");
  });
});
