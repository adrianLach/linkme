import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "linkme — URL Shortener & Analytics",
  description:
    "Shorten links, track clicks, and analyze your audience with linkme — a privacy-conscious URL shortener and IP logger.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
