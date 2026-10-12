'use client';

import { useEffect, useRef } from 'react';

type Node = { x: number; y: number; vx: number; vy: number; r: number; real: boolean; phase: number };
type Packet = { a: number; b: number; t: number; speed: number };

/**
 * The hero's living background: a drifting network of agents. Orange nodes are
 * real registered names; the rest are ambient. The cursor is a node too — it
 * pulls neighbours in and links to them.
 */
export function NetworkCanvas({ realCount }: { realCount: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const realRef = useRef(realCount);

  useEffect(() => {
    realRef.current = realCount;
  }, [realCount]);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !host || !ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true, last = 0, spawn = 0;
    let nodes: Node[] = [];
    const packets: Packet[] = [];
    const mouse = { x: -9999, y: -9999, active: false };
    const col = { fg: '#ede8dd', accent: '#ff5a1f' };
    const LINK = 150;

    const readColours = () => {
      const cs = getComputedStyle(document.documentElement);
      col.fg = cs.getPropertyValue('--fg').trim() || col.fg;
      col.accent = cs.getPropertyValue('--accent').trim() || col.accent;
    };

    const build = () => {
      const count = Math.max(26, Math.min(72, Math.floor((w * h) / 20000)));
      const accentCount = Math.max(4, Math.min(14, realRef.current));
      nodes = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: i < accentCount ? 3 + Math.random() * 1.6 : 1.1 + Math.random() * 1.2,
        real: i < accentCount,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.clientWidth;
      h = host.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };

    const frame = (time: number) => {
      const dt = Math.min((time - last) / 16.67, 3) || 1;
      last = time;
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        if (!reduce) {
          n.x += n.vx * dt;
          n.y += n.vy * dt;
          if (mouse.active) {
            const dx = mouse.x - n.x, dy = mouse.y - n.y;
            const d = Math.hypot(dx, dy);
            if (d < 220 && d > 1) {
              n.x += (dx / d) * 0.35 * dt;
              n.y += (dy / d) * 0.35 * dt;
            }
          }
        }
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;
      }

      // edges
      ctx.lineWidth = 1;
      ctx.strokeStyle = col.fg;
      const edges: [number, number][] = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d < LINK) {
            ctx.globalAlpha = (1 - d / LINK) * 0.2;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
            edges.push([i, j]);
          }
        }
      }

      // cursor links
      if (mouse.active) {
        ctx.strokeStyle = col.accent;
        for (const n of nodes) {
          const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
          if (d < 190) {
            ctx.globalAlpha = (1 - d / 190) * 0.65;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = col.accent;
        ctx.fill();
      }

      // packets travelling along edges
      spawn += dt;
      if (!reduce && spawn > 28 && edges.length) {
        spawn = 0;
        const [a, b] = edges[Math.floor(Math.random() * edges.length)];
        packets.push({ a, b, t: 0, speed: 0.012 + Math.random() * 0.012 });
      }
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.t += p.speed * dt;
        const A = nodes[p.a], B = nodes[p.b];
        if (p.t >= 1 || Math.hypot(A.x - B.x, A.y - B.y) > LINK * 1.15) {
          packets.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = col.accent;
        ctx.beginPath();
        ctx.arc(A.x + (B.x - A.x) * p.t, A.y + (B.y - A.y) * p.t, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // nodes
      for (const n of nodes) {
        if (n.real) {
          const pulse = 0.5 + 0.5 * Math.sin(time / 700 + n.phase);
          ctx.globalAlpha = 0.18 * (1 - pulse);
          ctx.strokeStyle = col.accent;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 4 + pulse * 12, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.fillStyle = col.accent;
        } else {
          ctx.globalAlpha = 0.55;
          ctx.fillStyle = col.fg;
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.active = mouse.x >= 0 && mouse.y >= 0 && mouse.x <= r.width && mouse.y <= r.height;
    };

    readColours();
    resize();
    start();

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    });
    io.observe(host);
    const mo = new MutationObserver(readColours);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('pointermove', onMove, { passive: true });
    const onVis = () => !document.hidden && start();
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0" />;
}
