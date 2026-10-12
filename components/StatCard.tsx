'use client';

import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  spark?: number[];
  className?: string;
}

function useCountUp(target: number, duration = 1400) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = reduce ? 1 : Math.min((now - start) / duration, 1);
      setN(target * (1 - Math.pow(1 - t, 4)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

/** Ledger-style figure: hairline above, huge serif numeral, mono caption. */
export function StatCard({ title, value, subtitle, className }: StatCardProps) {
  const isNum = typeof value === 'number';
  const animated = useCountUp(isNum ? value : 0);
  const decimals = isNum && !Number.isInteger(value) ? 2 : 0;
  const display = isNum ? animated.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : value;

  return (
    <div className={`border-t border-line-strong pb-2 pt-5 ${className ?? ''}`}>
      <p className="eyebrow">{title}</p>
      <p className="font-display mt-5 text-[clamp(3.5rem,7vw,6.5rem)] leading-[0.9] tabular-nums">{display}</p>
      {subtitle && <p className="mt-4 text-xs text-muted">{subtitle}</p>}
    </div>
  );
}
