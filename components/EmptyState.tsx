import { Loader2, Search, TrendingDown, Flag } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: typeof Loader2 | typeof Search | typeof TrendingDown | typeof Flag;
  buttonText?: string;
  onButtonClick?: () => void;
}

export function EmptyState({
  title,
  description,
  icon = Loader2,
  buttonText,
  onButtonClick,
}: EmptyStateProps) {
  const Icon = icon;

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center py-12">
      <Icon className="w-16 h-16 mx-auto text-muted mb-4" />
      <h3 className="text-xl font-medium text-explorer mb-2">{title}</h3>
      <p className="text-muted text-base mb-6">{description}</p>
      {buttonText && onButtonClick ? (
        <button onClick={onButtonClick} className="px-6 py-2 bg-accent text-explorer/90 rounded-lg hover:bg-accent/80 transition-colors">
          {buttonText}
        </button>
      ) : null}
    </div>
  );
}
