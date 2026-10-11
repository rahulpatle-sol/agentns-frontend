'use client';

import { useCallback } from 'react';
import { Copy } from 'lucide-react';

export interface AddressProps {
  address: string;
  onCopy?: () => void;
  className?: string;
}

export function Address({ address, onCopy, className }: AddressProps) {
  const short = `${address.slice(0, 4)}...${address.slice(-4)}`;
  
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(address);
    onCopy?.();
  }, [address, onCopy]);
  
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <span className="text-sm text-muted mono font-mono">{short}</span>
      {onCopy ? (
        <button
          onClick={handleCopy}
          className="p-1 rounded bg-surface hover:bg-accent/20 transition-colors"
          title="Copy address"
          aria-label="Copy address"
        >
          <Copy className="w-3 h-3" />
        </button>
      ) : null}
    </div>
  );
}
