import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "AquaGuard — Water Body Encroachment Reporting",
  description:
    "Report water body encroachments in your area. AI-powered verification, real-time map tracking, and direct authority notification to protect our water bodies.",
  keywords: ["water body", "encroachment", "report", "environment", "conservation", "AI"],
  authors: [{ name: "AquaGuard" }],
  openGraph: {
    title: "AquaGuard — Water Body Encroachment Reporting",
    description:
      "Report water body encroachments in your area. AI-powered verification and real-time map tracking.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        {/* Leaflet CSS - loaded globally since it's used on map pages */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
