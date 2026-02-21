import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "shareal.ink",
  description: "Share a link. Make it make sense.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/nyra/nyra-favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/nyra/nyra-favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={jakarta.className}>{children}</body>
    </html>
  );
}
