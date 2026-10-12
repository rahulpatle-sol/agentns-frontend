export interface BadgeTrustProps {
  badge: 'Trusted' | 'Verified' | 'Staked' | 'New' | 'Revoked';
  size?: 'sm' | 'md';
}

const styles = {
  Trusted: { dot: 'bg-ok', cls: 'border-ok/40 text-ok', label: 'Trusted' },
  Verified: { dot: 'bg-fg', cls: 'border-fg/30 text-fg', label: 'Verified' },
  Staked: { dot: 'bg-accent', cls: 'border-accent/40 text-accent', label: 'Staked' },
  New: { dot: 'bg-muted', cls: 'border-line-strong text-muted', label: 'New' },
  Revoked: { dot: 'bg-bad', cls: 'border-bad/40 text-bad', label: 'Revoked' },
} as const;

export function BadgeTrust({ badge, size = 'md' }: BadgeTrustProps) {
  const { dot, cls, label } = styles[badge];
  const pad = size === 'sm' ? 'px-2 py-[3px] text-[10px]' : 'px-2.5 py-1 text-[11px]';
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap border font-mono uppercase tracking-[0.12em] ${pad} ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
