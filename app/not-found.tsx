import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex items-center justify-center gap-2">
        <span className="text-6xl font-display font-bold text-accent">404</span>
        <span className="ping-dot relative h-2 w-2 rounded-full bg-accent" />
      </div>
      <h1 className="mb-3 text-3xl font-semibold tracking-tight sm:text-5xl">
        Page not found
      </h1>
      <p className="mx-auto max-w-md text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Let&apos;s get you back on track.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="btn-primary inline-flex h-11 items-center justify-center gap-2 px-6"
        >
          <Home className="h-4 w-4" />
          Back to Registry
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center gap-2 border border-line px-6 text-sm font-medium transition-colors hover:border-line-strong hover:text-fg"
        >
          <Search className="h-4 w-4" />
          Search names
        </Link>
      </div>
      <p className="mt-10 text-xs text-muted">
        <kbd className="border border-line px-1.5 py-0.5 font-mono">⌘K</kbd>{' '}
        to open search from anywhere
      </p>
    </div>
  );
}