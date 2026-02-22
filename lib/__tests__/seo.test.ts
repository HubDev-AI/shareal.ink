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
