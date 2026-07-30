import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./signal-house.css";
import AppShell from "@/components/shell/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Aurora — The Signal House",
    template: "%s | Aurora",
  },
  description:
    "A cinematic AI media house for film, music, public live television and recently checked global radio.",
  applicationName: "Aurora",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Aurora", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#020305",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
