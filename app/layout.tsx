import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentNS - Explorer",
  description: "AI Agent Name Registry Explorer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-explorer`}
    >
      <body
        className="min-h-full flex flex-col bg-explorer"
        suppressHydrationWarning
      >
        <Navigation />
        <main className="flex-1 p-6">
          {children}
        </main>
        <footer className="border-t border-explorer py-6 bg-surface text-text-muted text-center">
          <p className="text-sm">
            Devnet only. Test money.
          </p>
        </footer>
      </body>
    </html>
  );
}
