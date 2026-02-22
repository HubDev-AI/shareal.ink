import { describe, it, expect } from "vitest";
import { getDocSubType } from "@/lib/config/doc-sub-type";

describe("getDocSubType", () => {
  it("returns Google Sheets for sheets.google.com URLs", () => {
    const result = getDocSubType("https://sheets.google.com/spreadsheets/d/abc123");
    expect(result.label).toBe("Google Sheets");
    expect(result.iconColor).toContain("green");
  });

  it("returns Google Slides for slides.google.com URLs", () => {
    const result = getDocSubType("https://slides.google.com/presentation/d/abc123");
    expect(result.label).toBe("Google Slides");
    expect(result.iconColor).toContain("yellow");
  });

  it("returns Google Doc for docs.google.com URLs", () => {
    const result = getDocSubType("https://docs.google.com/document/d/abc123");
    expect(result.label).toBe("Google Doc");
    expect(result.iconColor).toContain("blue");
  });

  it("returns Google Doc for null URL", () => {
    const result = getDocSubType(null);
    expect(result.label).toBe("Google Doc");
  });

  it("returns Google Doc for unrecognized URLs", () => {
    const result = getDocSubType("https://example.com/something");
    expect(result.label).toBe("Google Doc");
  });
});
