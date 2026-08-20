import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ScrapeTrust",
  description: "Self-healing scraper pipeline with AI trust verification",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
