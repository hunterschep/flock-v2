import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Flock - Connect with Alumni",
    template: "%s | Flock"
  },
  description: "Connect with grads from your university and discover who's in your city. Build meaningful connections with alumni in your network.",
  keywords: ["alumni", "networking", "university", "college", "career", "connections", "graduates", "roommates"],
  authors: [{ name: "Flock" }],
  creator: "Flock",
  publisher: "Flock",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Flock",
    title: "Flock - Connect with Alumni",
    description: "Connect with grads from your university and discover who's in your city. Build meaningful connections with alumni in your network.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Flock - Your Alumni Network Visualized",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flock - Connect with Alumni",
    description: "Connect with grads from your university and discover who's in your city.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Skip to main content - accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:glass-button focus:px-4 focus:py-2 focus:rounded-lg focus:text-white focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
