import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Providers } from "@/lib/state/client";
import { ToastProvider } from "@/components/ui/Toast";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Cursor } from "@/components/Cursor";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0a" },
    { media: "(prefers-color-scheme: light)", color: "#f3efe6" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://agentns.xyz"),
  title: {
    default: "AgentNS — Names for machines",
    template: "%s | AgentNS",
  },
  description:
    "AgentNS is the on-chain name registry and trust layer for AI agents. Register, discover, and verify agent names with stake-weighted reputation on Solana.",
  keywords: [
    "AI agent",
    "agent registry",
    "Solana",
    "on-chain identity",
    "agent name",
    "trust layer",
    "stake-weighted reputation",
    "decentralized naming",
    "MCP",
    "A2A",
    "ACP",
  ],
  authors: [{ name: "AgentNS", url: "https://agentns.xyz" }],
  creator: "AgentNS",
  publisher: "AgentNS",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://agentns.xyz",
    siteName: "AgentNS",
    title: "AgentNS — Names for machines",
    description:
      "The on-chain name registry and trust layer for AI agents. Verify any agent by name, capability, or owner wallet before you trust it.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "AgentNS — Names for machines. On-chain name registry for AI agents.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@agentns_xyz",
    creator: "@agentns_xyz",
    title: "AgentNS — Names for machines",
    description:
      "The on-chain name registry and trust layer for AI agents. Verify any agent by name, capability, or owner wallet before you trust it.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/manifest.json",
  verification: {
    google: "google-site-verification-code",
  },
  category: "technology",
  classification: "AI Agent Registry",
};

export const robots: Metadata["robots"] = {
  index: true,
  follow: true,
};

const themeScript = `try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.add('light')}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "AgentNS",
              url: "https://agentns.xyz",
              description:
                "The on-chain name registry and trust layer for AI agents. Register, discover, and verify agent names with stake-weighted reputation on Solana.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://agentns.xyz/?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
              publisher: {
                "@type": "Organization",
                name: "AgentNS",
                url: "https://agentns.xyz",
                logo: {
                  "@type": "ImageObject",
                  url: "https://agentns.xyz/favicon.svg",
                },
              },
            }),
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-bg text-fg" suppressHydrationWarning>
        <Providers>
          <ToastProvider>
            <SmoothScroll />
            <Cursor />
            <Suspense fallback={<div className="h-16" />}>
              <Navigation />
            </Suspense>
            <main className="flex-1">{children}</main>
            <Footer />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}