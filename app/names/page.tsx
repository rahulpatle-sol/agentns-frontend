'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wallet } from 'lucide-react';

import { BadgeTrust } from '@/components/BadgeTrust';
import { AgentAvatar } from '@/components/AgentAvatar';
import { DataTable } from '@/components/DataTable';
import type { DataTableColumn } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { Alert, PageHeader } from '@/components/ui/Form';
import { formatRelative, formatSol } from '@/lib/format';
import { useRecordsByOwner } from '@/lib/state/queries';
import type { OwnedRecord } from '@/lib/state/queries';
import { useWallet } from '@/lib/state/wallet';
import { trustBadge } from '@/lib/trust';

export default function MyNamesPage() {
  const router = useRouter();
  const wallet = useWallet();
  const { data, error, isLoading } = useRecordsByOwner(wallet.address);

  const columns: DataTableColumn<OwnedRecord>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (_v, a) => (
        <div className="flex min-w-0 items-center gap-3">
          <AgentAvatar name={a.agentId} />
          <span className="max-w-[320px] truncate font-mono text-xs">{a.name}</span>
        </div>
      ),
    },
    { key: 'status', label: 'Status', render: (_v, a) => <BadgeTrust badge={trustBadge(a)} size="sm" /> },
    { key: 'stakeLamports', label: 'Stake', align: 'right', render: (v) => <span className="font-mono tabular-nums">{formatSol(v as bigint)}</span> },
    { key: 'registeredAt', label: 'Registered', render: (v) => <span className="text-xs text-muted">{formatRelative(v as bigint)}</span> },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 pb-8 pt-12">
      <PageHeader eyebrow="Portfolio" title="My names" lede="Every agent name owned by your connected wallet." />

      {!wallet.isConnected ? (
        <div className="card">
          <EmptyState icon={Wallet} title="Connect your wallet" description="Connect a wallet to see the names you own and manage their endpoints." />
        </div>
      ) : error ? (
        <Alert tone="error" title="Couldn’t load your names">{error instanceof Error ? error.message : String(error)}</Alert>
      ) : !isLoading && (data?.length ?? 0) === 0 ? (
        <div className="card">
          <EmptyState title="No names yet" description="This wallet doesn’t own any agent names on this cluster." />
          <div className="-mt-8 pb-12 text-center">
            <Link href="/register" className="btn-primary inline-flex h-10 items-center rounded-xl px-5 text-sm font-medium">
              Register your first name
            </Link>
          </div>
        </div>
      ) : (
        <DataTable
          title="Owned names"
          data={data ?? []}
          columns={columns}
          loading={isLoading}
          skeletonCount={4}
          getRowKey={(a) => a.pda}
          onRowClick={(a) => router.push(`/names/${a.pda}`)}
        />
      )}
    </div>
  );
}
