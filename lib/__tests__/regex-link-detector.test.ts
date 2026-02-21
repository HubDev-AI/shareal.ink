import { describe, it, expect } from "vitest";
import { RegexLinkDetector } from "@/lib/adapters/regex-link-detector";

const detector = new RegexLinkDetector();

describe("RegexLinkDetector", () => {
  it("detects Google Maps as restaurant", () => {
    const result = detector.detect("https://maps.google.com/maps?q=Pizza+Place");
    expect(result.linkType).toBe("restaurant");
    expect(result.suggestedActionLabel).toBe("I'm in!");
  });

  it("detects goo.gl/maps as restaurant", () => {
    const result = detector.detect("https://goo.gl/maps/abc123");
    expect(result.linkType).toBe("restaurant");
  });

  it("detects Yelp as restaurant", () => {
    const result = detector.detect("https://www.yelp.com/biz/pizza-place");
    expect(result.linkType).toBe("restaurant");
  });

  it("detects YouTube as video", () => {
    const result = detector.detect("https://www.youtube.com/watch?v=abc123");
    expect(result.linkType).toBe("video");
    expect(result.suggestedActionLabel).toBe("I'll watch it");
  });

  it("detects youtu.be as video", () => {
    const result = detector.detect("https://youtu.be/abc123");
    expect(result.linkType).toBe("video");
  });

  it("detects Vimeo as video", () => {
    const result = detector.detect("https://vimeo.com/123456");
    expect(result.linkType).toBe("video");
  });

  it("detects TikTok as video", () => {
    const result = detector.detect("https://www.tiktok.com/@user/video/123");
    expect(result.linkType).toBe("video");
  });

  it("detects Eventbrite as event", () => {
    const result = detector.detect("https://www.eventbrite.com/e/my-event-123");
    expect(result.linkType).toBe("event");
    expect(result.suggestedActionLabel).toBe("I'm in!");
  });

  it("detects lu.ma as event", () => {
    const result = detector.detect("https://lu.ma/my-event");
    expect(result.linkType).toBe("event");
  });

  it("detects Meetup as event", () => {
    const result = detector.detect("https://www.meetup.com/group/events/123");
    expect(result.linkType).toBe("event");
  });

  it("returns generic for unknown URLs", () => {
    const result = detector.detect("https://example.com/some-page");
    expect(result.linkType).toBe("generic");
    expect(result.suggestedActionLabel).toBe("Interested");
  });

  it("returns generic for blog posts", () => {
    const result = detector.detect("https://medium.com/article-title");
    expect(result.linkType).toBe("generic");
  });
});
