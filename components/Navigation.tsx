'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Moon, Search, ShieldCheck, Sun } from 'lucide-react';
import { WalletButton } from '@/components/WalletButton';
import { activeCluster } from '@/lib/config';

const links = [
  { label: 'Explorer', href: '/' },
  { label: 'Register', href: '/register' },
  { label: 'My names', href: '/names' },
  { label: 'Activity', href: '/activity' },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const focusSearch = useCallback(() => {
    const el = document.getElementById('hero-search') as HTMLInputElement | null;
    if (!el) {
      router.push('/');
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.focus({ preventScroll: true });
  }, [router]);

  // ⌘K / Ctrl+K jumps to the main search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        focusSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusSearch]);

  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains('light');
    document.documentElement.classList.toggle('light', next);
    try {
      localStorage.setItem('theme', next ? 'light' : 'dark');
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? 'glass border-line' : 'border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6" aria-label="Main">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-lg shadow-accent/30">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="text-[17px] font-semibold tracking-tight">AgentNS</span>
          </Link>
          <ul className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors hover:text-fg ${
                      active ? 'bg-fg/5 text-fg' : 'text-muted'
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={focusSearch}
            className="hidden items-center gap-2 rounded-lg border border-line bg-surface/60 py-1.5 pl-3 pr-2 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg sm:flex"
            aria-label="Search agents"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="pr-6">Search agents</span>
            <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </button>

          <span className="hidden items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1.5 text-xs font-medium lg:inline-flex">
            <span className="ping-dot relative h-1.5 w-1.5 rounded-full bg-ok" />
            {activeCluster.label}
          </span>

          <button
            onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface/60 text-muted transition-colors hover:border-line-strong hover:text-fg"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 light:hidden" />
            <Moon className="hidden h-4 w-4 light:block" />
          </button>

          <WalletButton />
        </div>
      </nav>
    </header>
  );
}
