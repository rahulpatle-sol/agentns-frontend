'use client';

import { useEffect, useRef } from 'react';

/** A lagging ring that swells over interactive things. Desktop pointers only. */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ring.current!;
    let x = -100, y = -100, tx = -100, ty = -100, raf = 0, scale = 1, target = 1;

    const move = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      el.style.opacity = '1';
      const t = e.target as Element | null;
      target = t?.closest('a,button,[role="button"],input,textarea,select,label') ? 2.4 : 1;
    };
    const leave = () => (el.style.opacity = '0');
    const loop = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      scale += (target - scale) * 0.15;
      el.style.transform = `translate3d(${x - 14}px, ${y - 14}px, 0) scale(${scale})`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mouseleave', leave);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseleave', leave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ring}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[95] hidden h-7 w-7 rounded-full border border-accent opacity-0 mix-blend-difference transition-opacity duration-300 [@media(pointer:fine)]:block"
    />
  );
}
