import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  serverExternalPackages: [
    "bullmq",
    "metascraper",
    "metascraper-description",
    "metascraper-image",
    "metascraper-title",
    "@metascraper/helpers",
    "re2",
    "url-regex-safe",
  ],
};

export default nextConfig;
