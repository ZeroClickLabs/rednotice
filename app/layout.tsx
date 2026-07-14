import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/site";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const title = "Free RedGifs Downloader – Save RedGifs Videos as MP4 in HD";
const description =
  "Free RedGifs downloader. Paste a RedGifs link and save the video as an MP4 in HD or SD. No account, no watermark, works on iPhone, Android, and desktop.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "RedGifs Downloader",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  other: { rating: "adult" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
