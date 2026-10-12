import type { Metadata } from "next";
import { Suspense } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Providers } from "@/lib/state/client";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "AgentNS — Trust layer for AI agents",
  description:
    "Look up any AI agent by name, capability or owner wallet and verify its stake, endpoint and track record on Solana before you trust it.",
};

// Runs before paint so the saved theme never flashes.
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-bg text-fg" suppressHydrationWarning>
        <Providers>
          <ToastProvider>
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
