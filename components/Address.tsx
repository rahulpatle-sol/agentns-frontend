'use client';

import { useCallback, useState } from 'react';
import { Check, Copy } from 'lucide-react';

export interface AddressProps {
  address: string;
  onCopy?: () => void;
  className?: string;
}

export function Address({ address, onCopy, className }: AddressProps) {
  const [copied, setCopied] = useState(false);
  const short = `${address.slice(0, 4)}…${address.slice(-4)}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }, [address, onCopy]);

  return (
    <div className={`inline-flex items-center gap-1.5 ${className ?? ''}`}>
      <span className="rounded-md bg-fg/5 px-1.5 py-0.5 font-mono text-xs text-muted">{short}</span>
      <button
        onClick={handleCopy}
        className="grid h-6 w-6 place-items-center rounded-md text-muted transition-colors hover:bg-fg/10 hover:text-fg"
        title="Copy address"
        aria-label="Copy address"
      >
        {copied ? <Check className="h-3 w-3 text-ok" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}
