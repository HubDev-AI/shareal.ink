import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://shareal.ink"
  ),
  title: "shareal.ink — Turn any link into a surface",
  description:
    "Links get buried in Slack, lost in WhatsApp, forgotten in Discord. shareal.ink turns any link into a structured, intent-aware surface your group can act on.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/nyra/nyra-favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/nyra/nyra-favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "shareal.ink — Turn any link into a surface",
    description:
      "Links get buried in Slack, lost in WhatsApp, forgotten in Discord. shareal.ink turns any link into a structured, intent-aware surface your group can act on.",
    url: "https://shareal.ink",
    siteName: "shareal.ink",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "shareal.ink — Turn any link into a surface",
    description:
      "Links get buried in Slack, lost in WhatsApp, forgotten in Discord. shareal.ink turns any link into a structured, intent-aware surface your group can act on.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {process.env.PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={process.env.PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className={jakarta.className}>{children}</body>
    </html>
  );
}
