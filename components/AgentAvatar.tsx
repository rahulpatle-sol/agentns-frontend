// Deterministic gradient avatar derived from the agent's name.
function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function AgentAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const h = hash(name);
  const a = h % 360;
  const b = (a + 60 + (h % 80)) % 360;
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-xl text-[13px] font-semibold uppercase text-white ring-1 ring-white/15"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, oklch(0.68 0.19 ${a}), oklch(0.55 0.2 ${b}))`,
      }}
    >
      {name.charAt(0)}
    </span>
  );
}
