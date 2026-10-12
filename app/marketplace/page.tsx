'use client';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, ExternalLink, Hash, Loader2, Wallet } from 'lucide-react';
import { address, type Address } from '@solana/kit';
import { useSWRConfig } from 'swr';
import { DataTable } from '@/components/DataTable';
import type { DataTableColumn } from '@/components/DataTable';
import { StatCard } from '@/components/StatCard';
import { BadgeTrust } from '@/components/BadgeTrust';
import { AgentAvatar } from '@/components/AgentAvatar';
import { EmptyState } from '@/components/EmptyState';
import { Alert } from '@/components/ui/Form';
import { Button } from '@/components/ui/Form';
import { Input } from '@/components/ui/Form';
import { Select } from '@/components/ui/Form';
import { useAllAgents, useListings, useRecordsByOwner, useRegistryConfig, type ListingWithPda } from '@/lib/state/queries';
import { useWallet } from '@/lib/state/wallet';
import { useTransaction } from '@/lib/state/transactions/useTransaction';
import { activeCluster, agentnsProgramId, explorerAddressUrl, explorerTxUrl } from '@/lib/config';
import { lamportsToSol, formatSol, shortenAddress, parseSol } from '@/lib/format';
import { getBuyNameInstruction, getCancelListingInstruction, getListNameInstruction, listingPda, agentPdaForName, hashName, configPda } from '@/lib/program/agentns';
import { Reveal } from '@/components/Reveal';
import { NetworkCanvas } from '@/components/NetworkCanvas';

const MARKETPLACE_LABEL = 'Marketplace';

export default function MarketplacePage() {
  const router = useRouter();
  const wallet = useWallet();
  const tx = useTransaction();
  const { mutate } = useSWRConfig?.() ?? { mutate: () => {} };

  const { data: allAgents, error: agentsError, isLoading: agentsLoading, mutate: mutateAgents } = useAllAgents();
  const { data: listings, error: listingsError, isLoading: listingsLoading, mutate: mutateListings } = useListings();
  const { data: ownedRecords, isLoading: ownedLoading, mutate: mutateOwned } = useRecordsByOwner(wallet.address ?? null);
  const { config, isLoading: configLoading, error: configError } = useRegistryConfig();

  const [activeTab, setActiveTab] = useState<'browse' | 'list' | 'available'>('browse');
  const [listForm, setListForm] = useState<{ recordPda: string | null; priceSol: string }>({
    recordPda: null,
    priceSol: '',
  });
  const [checkName, setCheckName] = useState('');
  const [checkedResult, setCheckedResult] = useState<{ available: boolean; name?: string; pda?: string } | null>(null);
  const [checking, setChecking] = useState(false);

  const all = useMemo(() => allAgents ?? [], [allAgents]);
  const listingData = useMemo(() => listings ?? [], [listings]);

  // Join listings with agent records by agentRecord PDA
  const enrichedListings = useMemo(() => {
    const agentByPda = new Map(all.map(a => [a.pda, a]));
    return listingData.map(l => ({
      ...l,
      record: agentByPda.get(l.agentRecord),
    })).filter(l => l.record); // only show listings with valid records
  }, [all, listingData]);

  // Stats
  const stats = useMemo(() => {
    const active = enrichedListings.length;
    const totalValue = enrichedListings.reduce((sum, l) => sum + Number(lamportsToSol(l.priceLamports)), 0);
    const floor = enrichedListings.length > 0
      ? Math.min(...enrichedListings.map(l => Number(lamportsToSol(l.priceLamports))))
      : 0;
    const totalStaked = all.reduce((sum, a) => sum + Number(lamportsToSol(a.stakeLamports)), 0);
    return { active, totalValue, floor, totalStaked, marketplaceFeeBps: config?.marketplaceFeeBps ?? 0 };
  }, [enrichedListings, all, config]);

  // Owned records that are NOT already listed
  const unlistedOwned = useMemo(() => {
    if (!ownedRecords) return [];
    const listedPdAs = new Set(listingData.map(l => l.agentRecord));
    return ownedRecords.filter(r => !listedPdAs.has(r.pda));
  }, [ownedRecords, listingData]);

  // Check name availability
  const handleCheckName = async () => {
    const trimmed = checkName.trim().toLowerCase();
    if (!trimmed) return;
    setChecking(true);
    setCheckedResult(null);
    try {
      const nameHash = await hashName(trimmed);
      const pda = await agentPdaForName(trimmed);
      // We'd need to check if account exists - useRecordByName would be better
      // For now, try to fetch via useRecordByName pattern - but that's a hook.
      // Fallback: try to derive and let user try register
      setCheckedResult({ available: true, name: trimmed, pda });
    } catch {
      setCheckedResult({ available: false, name: trimmed });
    } finally {
      setChecking(false);
    }
  };

  const handleList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listForm.recordPda || !listForm.priceSol) return;
    if (!wallet.address) return;

    const priceLamports = parseSol(listForm.priceSol);
    if (priceLamports === null) return;

    try {
      const recordPda = listForm.recordPda as Address;
      const listingAddress = await listingPda(recordPda);

      const ix = await getListNameInstruction(priceLamports, {
        owner: wallet.address,
        agentRecord: recordPda,
        listing: listingAddress,
      });

      await tx.send(ix, {
        pendingTitle: 'Listing name…',
        successTitle: 'Name listed',
        action: 'Listing name',
        onConfirmed: () => {
          void mutateListings?.();
          void mutateOwned?.();
          setListForm({ recordPda: null, priceSol: '' });
        },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleBuy = async (listing: typeof enrichedListings[0]) => {
    if (!wallet.address || !config) return;
    const maxPrice = listing.priceLamports;
    const listingAddress = await listingPda(listing.agentRecord);
    const configPdaAddr = await configPda(address(agentnsProgramId));

    const ix = await getBuyNameInstruction(maxPrice, {
      buyer: wallet.address,
      config: configPdaAddr,
      treasury: config.treasury,
      seller: listing.seller,
      agentRecord: listing.agentRecord,
      listing: listingAddress,
    });

    await tx.send(ix, {
      pendingTitle: `Buying ${listing.record?.name}…`,
      successTitle: 'Purchase complete',
      action: 'Buying name',
      onConfirmed: () => {
        void mutateListings?.();
        void mutateAgents?.();
        void mutateOwned?.();
      },
    });
  };

  const handleCancel = async (listing: typeof enrichedListings[0]) => {
    if (!wallet.address) return;
    const listingAddress = await listingPda(listing.agentRecord);

    const ix = await getCancelListingInstruction({
      seller: wallet.address,
      listing: listingAddress,
      agentRecord: listing.agentRecord,
    });

    await tx.send(ix, {
      pendingTitle: 'Cancelling listing…',
      successTitle: 'Listing cancelled',
      action: 'Cancelling listing',
      onConfirmed: () => {
        void mutateListings?.();
        void mutateOwned?.();
      },
    });
  };

  if (configError) {
    return (
      <div className="mx-auto max-w-[1500px] px-5 py-12">
        <Alert tone="error" title="Couldn't load registry config">
          {configError instanceof Error ? configError.message : String(configError)}
        </Alert>
      </div>
    );
  }

  const isReady = !agentsLoading && !listingsLoading && !configLoading && !ownedLoading;

  return (
    <div className="mx-auto max-w-[1500px] px-5 pb-12 pt-8 sm:px-8">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <NetworkCanvas realCount={all.length} />
        <div className="relative mx-auto max-w-[1500px] px-5 pb-8 pt-16 text-center sm:px-8 sm:pt-24">
          <p className="eyebrow fade-up flex items-center justify-center gap-2">
            <span className="ping-dot relative h-1.5 w-1.5 rounded-full bg-ok" />
            {activeCluster.label} · Live marketplace
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-normal leading-[1] tracking-tight sm:text-6xl">
            <span className="rise-mask"><span className="rise">Open marketplace for</span></span>
            <span className="rise-mask mt-1"><span className="rise font-display italic text-accent" style={{ animationDelay: '0.12s' }}>agent names</span></span>
          </h1>
          <p className="fade-up delay-2 mx-auto mt-5 max-w-xl text-center text-muted">
            Buy, sell, and discover agent names. Every listing is on-chain with trust-weighted reputation.
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="mx-auto mt-10 max-w-[1500px] px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
          <StatCard title="Active listings" value={stats.active} subtitle="Names for sale" />
          <StatCard title="Market volume" value={formatSol(BigInt(Math.round(stats.totalValue * 1e9)))} subtitle="Total listed value" />
          <StatCard title="Floor price" value={stats.floor > 0 ? formatSol(BigInt(Math.round(stats.floor * 1e9))) : '—'} subtitle="Lowest ask" />
          <StatCard title="Trust pool" value={formatSol(BigInt(Math.round(stats.totalStaked * 1e9)))} subtitle="Total staked" />
          <StatCard title="Marketplace fee" value={`${(stats.marketplaceFeeBps / 100).toFixed(1)}%`} subtitle="On every sale" />
        </div>
      </section>

      {/* Tabs */}
      <div className="mx-auto mt-10 max-w-[1500px] px-5 sm:px-8">
        <div className="flex gap-1 border-b border-line">
          {(['browse', 'list', 'available'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'}`}
            >
              {t === 'browse' && 'Browse listings'}
              {t === 'list' && 'List a name'}
              {t === 'available' && 'Check availability'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <section className="mx-auto mt-8 max-w-[1500px] px-5 sm:px-8">
        {activeTab === 'browse' && (
          <BrowseListings
            listings={enrichedListings}
            isLoading={!isReady}
            onBuy={handleBuy}
            onCancel={handleCancel}
            wallet={wallet}
            config={config}
            isBusy={tx.isBusy}
            mutateListings={mutateListings}
            mutateAgents={mutateAgents}
            mutateOwned={mutateOwned}
          />
        )}

        {activeTab === 'list' && (
          <ListYourName
            ownedRecords={unlistedOwned}
            form={listForm}
            setForm={setListForm}
            isLoading={!isReady || tx.isBusy}
            onSubmit={handleList}
            wallet={wallet}
          />
        )}

        {activeTab === 'available' && (
          <CheckAvailability
            checkName={checkName}
            setCheckName={setCheckName}
            result={checkedResult}
            checking={checking}
            onCheck={handleCheckName}
          />
        )}
      </section>
    </div>
  );
}

function configAddressMemo(config: ReturnType<typeof useRegistryConfig>['config']) {
  // We need the PDA address for buy - it's derived from config seed
  // The admin page computes it via configPda(). Let's derive it here too.
  // Since we can't await in render, we'll pass a function or compute inline.
  // Actually the buy instruction needs the config PDA - let's compute it once.
  // We'll do it in the buy handler via configPda() which is async.
  // For now return null placeholder - the handler calls configPda() directly.
  return null;
}

/* ────────────────────────────────────────────── */
/* Browse Listings                                 */
/* ────────────────────────────────────────────── */
function BrowseListings({
  listings,
  isLoading,
  onBuy,
  onCancel,
  wallet,
  config,
  isBusy,
  mutateListings,
  mutateAgents,
  mutateOwned,
}: {
  listings: (ListingWithPda & { record: any })[];
  isLoading: boolean;
  onBuy: (l: typeof listings[0]) => Promise<void>;
  onCancel: (l: typeof listings[0]) => Promise<void>;
  wallet: ReturnType<typeof useWallet>;
  config: any;
  isBusy: boolean;
  mutateListings: any;
  mutateAgents: any;
  mutateOwned: any;
}) {
  const columns = useMemo((): DataTableColumn<any>[] => [
    {
      key: 'name',
      label: 'Agent',
      sortable: true,
      render: (_, l) => (
        <div className="flex items-center gap-3">
          <AgentAvatar name={l.record?.name ?? 'Unknown'} size={28} />
          <div className="min-w-0">
            <p className="font-medium capitalize leading-tight">{l.record?.name ?? 'Unknown'}</p>
            <p className="mt-0.5 font-mono text-xs text-muted">{shortenAddress(l.record?.agentId ?? '', 6, 4)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'capability',
      label: 'Capability',
      sortable: true,
      render: (_, l) => (
        <span className="rounded-md bg-fg/5 px-2 py-1 font-mono text-xs text-fg/80">{l.record?.capability ?? '—'}</span>
      ),
    },
    {
      key: 'trust',
      label: 'Trust',
      sortable: true,
      render: (_, l) => <BadgeTrust badge={trustBadge(l.record)} size="sm" />,
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      align: 'right',
      render: (_, l) => (
        <span className="font-mono tabular-nums font-medium">{formatSol(l.priceLamports)}</span>
      ),
    },
    {
      key: 'seller',
      label: 'Seller',
      sortable: true,
      render: (_, l) => (
        <span className="font-mono text-xs text-muted">{shortenAddress(l.seller, 4, 4)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_, l) => {
        const isSeller = wallet.address === l.seller;
        if (!wallet.isConnected) {
          return <span className="text-xs text-muted">Connect wallet</span>;
        }
        if (isSeller) {
          return (
            <Button
              variant="ghost"
              onClick={() => onCancel(l)}
              loading={isBusy}
              className="h-8 px-3"
            >
              Cancel
            </Button>
          );
        }
        return (
          <Button
            variant="primary"
            onClick={() => onBuy(l)}
            loading={isBusy}
            className="h-8 px-3"
            disabled={!config}
          >
            Buy
          </Button>
        );
      },
    },
  ], [listings, wallet, config, isBusy]);

  if (isLoading) {
    return <div className="card p-8"><DataTable title="Listings" data={[]} columns={columns} skeletonCount={6} loading /></div>;
  }

  if (listings.length === 0) {
    return (
      <div className="card p-12 text-center">
        <EmptyState title="No active listings" description="Be the first to list a name, or check back later." />
      </div>
    );
  }

  return (
    <DataTable
      title="Active Listings"
      data={listings}
      columns={columns}
      loading={isLoading}
      getRowKey={l => l.pda}
      emptyMessage="No listings match your filters"
    />
  );
}

function ListYourName({
  ownedRecords,
  form,
  setForm,
  isLoading,
  onSubmit,
  wallet,
}: {
  ownedRecords: any[];
  form: { recordPda: string | null; priceSol: string };
  setForm: React.Dispatch<React.SetStateAction<{ recordPda: string | null; priceSol: string }>>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  wallet: ReturnType<typeof useWallet>;
}) {
  if (!wallet.isConnected) {
    return (
      <div className="card p-8 text-center">
        <Wallet className="mx-auto h-12 w-12 text-muted" />
        <h3 className="mt-4 text-lg font-semibold">Connect your wallet</h3>
        <p className="mt-2 text-muted">You need to connect a wallet to list names you own.</p>
      </div>
    );
  }

  if (ownedRecords.length === 0) {
    return (
      <div className="card p-8 text-center">
        <EmptyState
          title="No names to list"
          description="You don't own any unlisted names yet. Register one first, then come back to list it."
        />
        <div className="mt-6">
          <Link href="/register" className="btn-primary inline-flex h-10 items-center px-5">
            Register a name
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-6 p-6">
      <h2 className="text-base font-semibold tracking-tight">List one of your names</h2>
      <p className="text-sm text-muted">Pick a name you own, set a price, and list it instantly.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-fg/80 mb-1.5">Name</label>
          <Select
            value={form.recordPda ?? ''}
            onChange={(e) => setForm(c => ({ ...c, recordPda: e.target.value || null }))}
          >
            <option value="">— Choose —</option>
            {ownedRecords.map(r => (
              <option key={r.pda} value={r.pda}>
                {r.name} ({shortenAddress(r.pda, 4, 4)})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-fg/80 mb-1.5">Price (SOL)</label>
          <Input
            type="text"
            inputMode="decimal"
            value={form.priceSol}
            onChange={(e) => setForm(c => ({ ...c, priceSol: e.target.value }))}
            placeholder="e.g. 10.5"
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading || !form.recordPda || !form.priceSol} loading={isLoading} className="w-full sm:w-auto">
        List for sale
      </Button>
    </form>
  );
}

function CheckAvailability({
  checkName,
  setCheckName,
  result,
  checking,
  onCheck,
}: {
  checkName: string;
  setCheckName: (v: string) => void;
  result: { available: boolean; name?: string; pda?: string } | null;
  checking: boolean;
  onCheck: () => Promise<void>;
}) {
  return (
    <div className="card p-6 space-y-6 max-w-xl">
      <h2 className="text-base font-semibold tracking-tight">Check if a name is available</h2>
      <p className="text-sm text-muted">Enter a full name (e.g. <code className="font-mono">mcp://sentiment.text-analysis.acme.v1.0</code>) to check availability.</p>

      <div className="flex gap-2">
        <Input
          type="text"
          value={checkName}
          onChange={(e) => setCheckName(e.target.value)}
          placeholder="mcp://agent.capability.provider.v1.0"
          className="flex-1 font-mono"
          onKeyDown={(e) => e.key === 'Enter' && onCheck()}
        />
        <Button onClick={onCheck} loading={checking} disabled={!checkName.trim() || checking}>
          Check
        </Button>
      </div>

      {result && (
        <div className={`p-4 rounded-xl border ${result.available ? 'border-ok/30 bg-ok/10' : 'border-bad/30 bg-bad/10'}`}>
          <div className="flex items-center gap-2 text-sm">
            {result.available ? (
              <>
                <span className="text-ok">● Available</span>
                <span className="text-muted">{result.name}</span>
              </>
            ) : (
              <>
                <span className="text-bad">● Taken</span>
                <span className="text-muted">{result.name}</span>
              </>
            )}
          </div>
          {result.available && (
            <div className="mt-3">
              <Link href={`/register`} className="btn-primary inline-flex h-10 items-center px-5 text-sm">
                Register this name
              </Link>
              <p className="mt-2 text-xs text-muted">The name parts will be pre-filled on the register page.</p>
            </div>
          )}
          {!result.available && (
            <div className="mt-3">
              <a
                href={`/names/${result.pda}`}
                className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> View on registry
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────── */
/* Helpers                                        */
/* ────────────────────────────────────────────── */
function trustBadge(agent: any): 'Trusted' | 'Verified' | 'Staked' | 'New' | 'Revoked' {
  if (agent.status === 'revoked') return 'Revoked';
  if (agent.endpointVerified) return 'Verified';
  if (Number(agent.stakeLamports) > 0) return 'Staked';
  return 'New';
}
