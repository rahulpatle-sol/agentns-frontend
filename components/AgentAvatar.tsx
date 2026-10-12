// Generative "sigil": a small Bauhaus composition derived from the agent's name.
// Same name → same sigil, everywhere.

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GROUNDS = ['#15140f', '#1d1a14', '#10181a', '#1a1320', '#191510'];
const INKS = ['#ff5a1f', '#f2b84b', '#ede8dd', '#7be495', '#8aa4ff'];
const GRID = [20, 50, 80];

export function AgentAvatar({ name, size = 36, className = '' }: { name: string; size?: number; className?: string }) {
  const r = rng(hash(name));
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const ground = pick(GROUNDS);
  const shapes = Array.from({ length: 3 }, (_, i) => {
    const kind = Math.floor(r() * 5);
    const color = i === 0 ? INKS[0] : pick(INKS);
    const cx = pick(GRID), cy = pick(GRID);
    const s = 16 + r() * 18;
    return { kind, color, cx, cy, s, rot: Math.floor(r() * 4) * 90 };
  });

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      className={`shrink-0 rounded-lg ring-1 ring-white/10 ${className}`}
      style={{ width: size, height: size, background: ground }}
    >
      {shapes.map((sh, i) => {
        const t = `rotate(${sh.rot} ${sh.cx} ${sh.cy})`;
        switch (sh.kind) {
          case 0:
            return <circle key={i} cx={sh.cx} cy={sh.cy} r={sh.s} fill={sh.color} opacity={i === 0 ? 1 : 0.92} />;
          case 1:
            return <path key={i} transform={t} d={`M${sh.cx - sh.s} ${sh.cy} A${sh.s} ${sh.s} 0 0 1 ${sh.cx + sh.s} ${sh.cy} Z`} fill={sh.color} />;
          case 2:
            return <rect key={i} transform={t} x={sh.cx - sh.s} y={sh.cy - sh.s / 4} width={sh.s * 2} height={sh.s / 2} fill={sh.color} />;
          case 3:
            return <circle key={i} cx={sh.cx} cy={sh.cy} r={sh.s} fill="none" stroke={sh.color} strokeWidth={5} />;
          default:
            return <path key={i} transform={t} d={`M${sh.cx} ${sh.cy - sh.s} L${sh.cx + sh.s} ${sh.cy + sh.s} L${sh.cx - sh.s} ${sh.cy + sh.s} Z`} fill={sh.color} />;
        }
      })}
    </svg>
  );
}
