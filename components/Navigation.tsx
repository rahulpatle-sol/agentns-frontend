'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Moon, Sun, X } from 'lucide-react';
import { WalletButton } from '@/components/WalletButton';
import { activeCluster } from '@/lib/config';

const links = [
  { label: 'Registry', href: '/' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Register', href: '/register' },
  { label: 'My names', href: '/names' },
  { label: 'Activity', href: '/activity' },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const focusSearch = useCallback(() => {
    const el = document.getElementById('hero-search') as HTMLInputElement | null;
    if (!el) {
      router.push('/');
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    el.focus({ preventScroll: true });
  }, [router]);

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

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <>
      <header className={`sticky top-0 z-50 border-b transition-colors duration-300 ${scrolled || open ? 'border-line bg-bg/90 backdrop-blur-md' : 'border-transparent'}`}>
        <nav className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-6 px-5 sm:px-8" aria-label="Main">
          <Link href="/" onClick={() => setOpen(false)} className="group flex items-baseline gap-2">
            <span className="font-display text-[28px] leading-none">AgentNS</span>
            <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-accent transition-transform duration-500 group-hover:scale-[2.4]" />
          </Link>

          <ul className="hidden items-center gap-8 lg:flex">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? 'page' : undefined}
                  className={`link-u font-mono text-[11px] uppercase tracking-[0.14em] transition-colors hover:text-fg ${isActive(l.href) ? 'text-fg [background-size:100%_1px] [background-image:linear-gradient(var(--accent),var(--accent))]' : 'text-muted'}`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2.5">
            <button
              onClick={focusSearch}
              className="hidden items-center gap-2 border border-line px-3 py-1.5 font-mono text-[11px] text-muted transition-colors hover:border-line-strong hover:text-fg md:flex"
              aria-label="Search names"
            >
              Resolve a name <kbd className="border border-line px-1 text-[10px]">⌘K</kbd>
            </button>
            <span className="hidden items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted xl:inline-flex">
              <span className="ping-dot relative h-1.5 w-1.5 rounded-full bg-ok" />
              {activeCluster.label}
            </span>
            <button onClick={toggleTheme} className="grid h-9 w-9 place-items-center border border-line text-muted transition-colors hover:border-line-strong hover:text-fg" aria-label="Toggle theme">
              <Sun className="h-4 w-4 light:hidden" />
              <Moon className="hidden h-4 w-4 light:block" />
            </button>
            <WalletButton />
            <button onClick={() => setOpen((o) => !o)} className="grid h-9 w-9 place-items-center border border-line lg:hidden" aria-label="Menu" aria-expanded={open}>
              {open ? <X className="h-4 w-4" /> : <span className="flex flex-col gap-[5px]"><i className="block h-px w-4 bg-fg" /><i className="block h-px w-4 bg-fg" /></span>}
            </button>
          </div>
        </nav>
      </header>

      {open && (
        <div className="fixed inset-0 top-16 z-40 flex flex-col justify-between bg-bg px-5 pb-10 pt-8 lg:hidden">
          <ul className="space-y-1">
            {links.map((l, i) => (
              <li key={l.href} className="fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <Link href={l.href} onClick={() => setOpen(false)} className={`font-display block text-6xl leading-[1.05] ${isActive(l.href) ? 'text-accent' : ''}`}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="eyebrow">{activeCluster.label} · on-chain registry for AI agents</p>
        </div>
      )}
    </>
  );
}
