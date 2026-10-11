'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye, Moon, Search, Settings, Sun } from 'lucide-react';

export function Navigation() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const focusedInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchQuery.length > 0) {
      focusedInputRef.current?.focus();
    }
  }, [searchQuery]);

  return (
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-explorer">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-explorer border border-explorer flex items-center justify-center">
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path className="stroke-2" strokeWidth={2} d="M12 2L2 7l10 5 10-5-10-5z" />
              <path className="stroke-2" strokeWidth={2} d="M2 7h20a2 2 0 012 2v1a2 2 0 01-2 2H4a2 2 0 01-2-2v-1a2 2 0 012-2z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tighter text-explorer">AgentNS</span>
        </div>

        {/* Search Box */}
        <div className="hidden md:flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search agent name, capability or owner wallet"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setShowSuggestions(false)}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-surface border border-explorer focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent placeholder-text-muted"
              ref={focusedInputRef}
            />
          </div>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="p-2 rounded-lg hover:bg-surface/50 transition-colors"
            aria-label="Search"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>

        {/* Network Pill and Actions */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">Devnet</span>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-explorer">
            <svg className="w-3 h-3 text-explorer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path className="stroke-2" strokeWidth={2} d="M12 1v4M12 19v4M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h4M19 12h4M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            <span className="text-xs text-muted">Connected</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-surface/50 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button className="hidden md:block p-2 rounded-lg hover:bg-surface/50 transition-colors" aria-label="Connect wallet">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
