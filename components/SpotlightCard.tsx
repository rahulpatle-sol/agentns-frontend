'use client';

import type { HTMLAttributes } from 'react';

/** Card with a light that follows the cursor. */
export function SpotlightCard({ className = '', onMouseMove, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
        onMouseMove?.(e);
      }}
      className={`spot ${className}`}
    />
  );
}
