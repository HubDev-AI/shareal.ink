import { describe, it, expect } from "vitest";
import { RegexLinkDetector } from "@/lib/adapters/regex-link-detector";

const detector = new RegexLinkDetector();

describe("RegexLinkDetector", () => {
  it("detects Google Maps as google_maps", () => {
    const result = detector.detect("https://maps.google.com/maps?q=Pizza+Place");
    expect(result.linkType).toBe("google_maps");
    expect(result.suggestedActionLabel).toBe("I'm in!");
  });

  it("detects goo.gl/maps as google_maps", () => {
    const result = detector.detect("https://goo.gl/maps/abc123");
    expect(result.linkType).toBe("google_maps");
  });

  it("detects maps.app.goo.gl as google_maps", () => {
    const result = detector.detect("https://maps.app.goo.gl/abc123");
    expect(result.linkType).toBe("google_maps");
  });

  it("detects Yelp as google_maps", () => {
    const result = detector.detect("https://www.yelp.com/biz/pizza-place");
    expect(result.linkType).toBe("google_maps");
  });

  it("detects YouTube as youtube", () => {
    const result = detector.detect("https://www.youtube.com/watch?v=abc123");
    expect(result.linkType).toBe("youtube");
    expect(result.suggestedActionLabel).toBe("I'll watch it");
  });

  it("detects youtu.be as youtube", () => {
    const result = detector.detect("https://youtu.be/abc123");
    expect(result.linkType).toBe("youtube");
  });

  it("detects Instagram post as instagram", () => {
    const result = detector.detect("https://www.instagram.com/p/abc123/");
    expect(result.linkType).toBe("instagram");
  });

  it("detects Instagram reel as instagram", () => {
    const result = detector.detect("https://www.instagram.com/reel/abc123/");
    expect(result.linkType).toBe("instagram");
  });

  it("detects TikTok as tiktok", () => {
    const result = detector.detect("https://www.tiktok.com/@user/video/123");
    expect(result.linkType).toBe("tiktok");
  });

  it("detects Spotify track as spotify", () => {
    const result = detector.detect("https://open.spotify.com/track/abc123");
    expect(result.linkType).toBe("spotify");
  });

  it("detects Spotify playlist as spotify", () => {
    const result = detector.detect("https://open.spotify.com/playlist/abc123");
    expect(result.linkType).toBe("spotify");
  });

  it("detects X/Twitter post as x_twitter", () => {
    const result = detector.detect("https://x.com/user/status/123");
    expect(result.linkType).toBe("x_twitter");
  });

  it("detects twitter.com as x_twitter", () => {
    const result = detector.detect("https://twitter.com/user/status/123");
    expect(result.linkType).toBe("x_twitter");
  });

  it("detects Vimeo as generic", () => {
    const result = detector.detect("https://vimeo.com/123456");
    expect(result.linkType).toBe("generic");
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
