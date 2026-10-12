import type { LucideIcon } from 'lucide-react';
import { Search } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  buttonText?: string;
  onButtonClick?: () => void;
}

export function EmptyState({ title, description, icon: Icon = Search, buttonText, onButtonClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/20">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>
      {buttonText && onButtonClick ? (
        <button onClick={onButtonClick} className="btn-primary mt-6 rounded-lg px-5 py-2 text-sm font-medium">
          {buttonText}
        </button>
      ) : null}
    </div>
  );
}
