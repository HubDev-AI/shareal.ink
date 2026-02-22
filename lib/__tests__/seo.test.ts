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

describe("SEO: JSON-LD structured data", () => {
  it("contains valid WebApplication schema fields", () => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "shareal.ink",
      url: "https://shareal.ink",
      description:
        "Turn any link into a structured, intent-aware surface your group can act on.",
      applicationCategory: "SocialNetworkingApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    };

    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("WebApplication");
    expect(jsonLd.name).toBe("shareal.ink");
    expect(jsonLd.url).toBe("https://shareal.ink");
    expect(jsonLd.applicationCategory).toBe("SocialNetworkingApplication");
    expect(jsonLd.offers.price).toBe("0");
  });
});
