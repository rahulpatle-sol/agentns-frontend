import { CheckCircle, Clock, Leaf, Shield } from 'lucide-react';

export interface BadgeTrustProps {
  badge: 'Trusted' | 'Verified' | 'Staked' | 'New';
  size?: 'sm' | 'md';
}

export function BadgeTrust({ badge, size = 'md' }: BadgeTrustProps) {
  const sizes = { sm: 'w-6 h-6', md: 'w-8 h-8' };
  const sizeClass = sizes[size];
  
  const colors = {
    Trusted: 'bg-emerald-500/20 text-emerald-400',
    Verified: 'bg-green-500/20 text-green-400',
    Staked: 'bg-blue-500/20 text-blue-400',
    New: 'bg-gray-500/20 text-gray-400',
  };
  
  const labels = {
    Trusted: 'Trusted',
    Verified: 'Endpoint verified',
    Staked: 'Staked',
    New: 'New',
  };
  
  const icons = {
    Trusted: <Shield className="w-3 h-3" />,
    Verified: <CheckCircle className="w-3 h-3" />,
    Staked: <Leaf className="w-3 h-3" />,
    New: <Clock className="w-3 h-3" />,
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium ${colors[badge]}`}>
      <span className={`${sizeClass} flex items-center justify-center`}>
        {icons[badge]}
      </span>
      <span className="text-explorer">{labels[badge]}</span>
    </span>
  );
}
