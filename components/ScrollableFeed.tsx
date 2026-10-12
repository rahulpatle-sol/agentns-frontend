'use client';

import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import { explorerTxUrl } from '@/lib/config';
import { formatRelative, shortenAddress } from '@/lib/format';
import { useRecentTransactions } from '@/lib/state/queries';
import { SkeletonAvatar, SkeletonLine } from './Skeleton';

/** Live program activity: the latest signatures that touched the AgentNS program. */
export function ScrollableFeed({ limit = 8 }: { limit?: number }) {
  const { data, error, isLoading } = useRecentTransactions(limit);

  if (isLoading) {
    return (
      <div className="space-y-5 p-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <SkeletonAvatar className="!h-9 !w-9 !rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonLine height={12} className="w-1/2" />
              <SkeletonLine height={10} className="w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) return <p className="p-5 text-sm text-muted">Couldn’t load activity from the RPC endpoint.</p>;
  if (!data || data.length === 0) return <p className="p-5 text-sm text-muted">No transactions yet for this program.</p>;

  return (
    <ol className="relative p-5">
      <span aria-hidden className="absolute bottom-8 left-[2.15rem] top-8 w-px bg-gradient-to-b from-line-strong via-line to-transparent" />
      {data.map((tx) => {
        const ok = tx.status === 'success';
        return (
          <li key={tx.signature} className="relative flex gap-3.5 py-3 first:pt-0 last:pb-0">
            <span
              className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${
                ok ? 'bg-ok/10 text-ok ring-ok/25' : 'bg-bad/10 text-bad ring-bad/25'
              }`}
            >
              {ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{ok ? 'Transaction confirmed' : 'Transaction failed'}</p>
                <time className="shrink-0 text-xs text-muted">{tx.timestamp ? formatRelative(tx.timestamp) : 'pending'}</time>
              </div>
              <a
                href={explorerTxUrl(tx.signature)}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-xs text-muted hover:text-accent"
              >
                {shortenAddress(tx.signature, 8, 6)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
