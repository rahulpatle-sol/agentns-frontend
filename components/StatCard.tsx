import { Sparkles, TrendingUp, Users, CheckCircle } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: typeof Sparkles | typeof TrendingUp | typeof Users | typeof CheckCircle;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon = Sparkles,
  className,
}: StatCardProps) {
  const Icon = icon;

  return (
    <div 
      className={`bg-surface border border-explorer rounded-xl p-6 transition-colors hover:bg-surface/80 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted text-sm uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-explorer">{typeof value === 'number' ? `${value}` : value}</p>
        </div>
        {Icon && <Icon className="w-5 h-5 text-accent" />}
      </div>
      {subtitle && (
        <p className="text-muted text-xs mt-1">{subtitle}</p>
      )}
    </div>
  );
}
