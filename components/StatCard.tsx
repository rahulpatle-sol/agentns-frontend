'use client';

import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  /** Decorative sparkline points (any scale). */
  spark?: number[];
  className?: string;
}

function useCountUp(target: number, duration = 1100) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = reduce ? 1 : Math.min((now - start) / duration, 1);
      setN(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

function Sparkline({ points }: { points: number[] }) {
  const w = 120;
  const h = 36;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const coords = points.map((p, i) => [(i / (points.length - 1)) * w, h - 4 - ((p - min) / span) * (h - 8)]);
  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const id = `spark-${points.join('').slice(0, 12)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-28" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon = Sparkles, spark, className }: StatCardProps) {
  const isNum = typeof value === 'number';
  const animated = useCountUp(isNum ? value : 0);
  const decimals = isNum && !Number.isInteger(value) ? 1 : 0;
  const display = isNum
    ? animated.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : value;

  return (
    <div className={`card card-hover group overflow-hidden p-5 ${className ?? ''}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">{title}</p>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10 text-accent ring-1 ring-accent/20 transition-colors group-hover:bg-accent/20">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-4xl font-semibold tracking-tight tabular-nums">{display}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        {spark && spark.length > 1 && <Sparkline points={spark} />}
      </div>
    </div>
  );
}
