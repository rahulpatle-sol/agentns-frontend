import { Ban, CheckCircle2, Clock, Coins, ShieldCheck } from 'lucide-react';

export interface BadgeTrustProps {
  badge: 'Trusted' | 'Verified' | 'Staked' | 'New' | 'Revoked';
  size?: 'sm' | 'md';
}

const styles = {
  Trusted: { cls: 'bg-ok/10 text-ok ring-ok/25', label: 'Trusted', Icon: ShieldCheck },
  Verified: { cls: 'bg-accent-2/10 text-accent-2 ring-accent-2/25', label: 'Endpoint verified', Icon: CheckCircle2 },
  Staked: { cls: 'bg-accent/10 text-accent ring-accent/25', label: 'Staked', Icon: Coins },
  New: { cls: 'bg-fg/5 text-muted ring-line-strong', label: 'New', Icon: Clock },
  Revoked: { cls: 'bg-bad/10 text-bad ring-bad/25', label: 'Revoked', Icon: Ban },
} as const;

export function BadgeTrust({ badge, size = 'md' }: BadgeTrustProps) {
  const { cls, label, Icon } = styles[badge];
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset ${pad} ${cls}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
