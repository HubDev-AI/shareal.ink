import { describe, it, expect } from "vitest";

describe("SEO: robots.txt", () => {
  it("exports a function returning valid robots config", async () => {
    const { default: robots } = await import("@/app/robots");
    const result = robots();

    expect(result).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: "/api/" },
      sitemap: "https://shareal.ink/sitemap.xml",
    });
  });
});

describe("SEO: sitemap.xml", () => {
  it("exports a function returning homepage-only sitemap", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const result = sitemap();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      url: "https://shareal.ink",
      changeFrequency: "weekly",
      priority: 1.0,
    });
    expect(result[0].lastModified).toBeInstanceOf(Date);
  });
});
