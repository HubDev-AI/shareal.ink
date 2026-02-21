import { describe, it, expect } from "vitest";
import { inferIntentType } from "@/lib/infer-intent";

describe("inferIntentType", () => {
  it("returns 'vote' when text contains a question mark", () => {
    expect(inferIntentType("Should I buy this?", "generic")).toBe("vote");
  });

  it("returns 'meet' for time-like patterns", () => {
    expect(inferIntentType("Friday 7PM", "generic")).toBe("meet");
    expect(inferIntentType("Tomorrow at noon", "generic")).toBe("meet");
    expect(inferIntentType("tonight", "generic")).toBe("meet");
    expect(inferIntentType("Let's go Monday", "generic")).toBe("meet");
    expect(inferIntentType("Dinner at 8pm", "generic")).toBe("meet");
  });

  it("returns link type default for empty text", () => {
    expect(inferIntentType("", "google_maps")).toBe("meet");
    expect(inferIntentType("", "youtube")).toBe("share");
  });

  it("returns link type default for non-matching text", () => {
    expect(inferIntentType("Check this out", "spotify")).toBe("share");
    expect(inferIntentType("My favorite song", "generic")).toBe("share");
  });

  it("prioritizes question mark over time patterns", () => {
    expect(inferIntentType("Friday at 7?", "generic")).toBe("vote");
  });
});
