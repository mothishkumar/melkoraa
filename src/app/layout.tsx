import type { Metadata } from "next";
import { Cormorant_Garamond, Geist_Mono, Inter } from "next/font/google";

import { getSiteUrl } from "@/lib/auth/site-url";
import { brand } from "@/lib/brand";

import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — ${brand.tagline.replace(/\.$/, "")}`,
    template: `%s — ${brand.name}`,
  },
  description: `${brand.tagline} ${brand.drop.label}. ${brand.drop.message}`,
  metadataBase: new URL(getSiteUrl()),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
