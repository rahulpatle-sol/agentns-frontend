'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, BadgeCheck, Bot, Coins, RotateCcw, Search, X } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import type { DataTableColumn } from '@/components/DataTable';
import { StatCard } from '@/components/StatCard';
import { ScrollableFeed } from '@/components/ScrollableFeed';
import { BadgeTrust } from '@/components/BadgeTrust';
import { AgentAvatar } from '@/components/AgentAvatar';
import { EmptyState } from '@/components/EmptyState';
import { Alert } from '@/components/ui/Form';
import { useAllAgents, useRecentTransactions } from '@/lib/state/queries';
import type { OwnedRecord } from '@/lib/state/queries';
import { passRate, trustBadge } from '@/lib/trust';
import { activeCluster, agentnsProgramId } from '@/lib/config';
import { lamportsToSol, shortenAddress } from '@/lib/format';

const SHOWCASE = ['mcp://sentiment.text-analysis.acme.v1.0', 'mcp://web-search.lucide.v1.0', 'a2a://planner.orchestration.demo.v1.0'];

type Filters = { capability?: string; minStake: number; showRevoked: boolean };
const DEFAULT_FILTERS: Filters = { capability: undefined, minStake: 0, showRevoked: false };

export default function Home() {
  const router = useRouter();
  const { data: agents, error, isLoading, mutate } = useAllAgents();
  const { data: txs } = useRecentTransactions(50);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');

  const all = useMemo(() => agents ?? [], [agents]);

  const stats = useMemo(
    () => ({
      totalAgents: all.length,
      totalStakedSOL: all.reduce((sum, a) => sum + lamportsToSol(a.stakeLamports), 0),
      verifiedAgents: all.filter((a) => a.endpointVerified).length,
      recentTxs: txs?.length ?? 0,
    }),
    [all, txs],
  );

  const capabilities = useMemo(() => Array.from(new Set(all.map((a) => a.capability))).sort().slice(0, 8), [all]);
  const maxStake = Math.max(1, Math.ceil(Math.max(0, ...all.map((a) => lamportsToSol(a.stakeLamports)))));

  const q = searchQuery.trim().toLowerCase();
  const rows = useMemo(
    () =>
      all.filter(
        (a) =>
          (filters.showRevoked || a.status !== 'revoked') &&
          (!filters.capability || a.capability === filters.capability) &&
          lamportsToSol(a.stakeLamports) >= filters.minStake &&
          (!q || a.name.toLowerCase().includes(q) || a.capability.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q)),
      ),
    [all, filters, q],
  );

  const hasActiveFilters = !!searchQuery || !!filters.capability || filters.minStake > 0 || filters.showRevoked;
  const resetAll = () => {
    setSearchQuery('');
    setFilters(DEFAULT_FILTERS);
  };

  const columns: DataTableColumn<OwnedRecord>[] = [
    {
      key: 'name',
      label: 'Agent',
      sortable: true,
      render: (_v, agent) => (
        <div className="flex min-w-0 items-center gap-3">
          <AgentAvatar name={agent.agentId} />
          <div className="min-w-0">
            <p className="font-medium capitalize leading-tight">{agent.agentId}</p>
            <p className="mt-0.5 max-w-[260px] truncate font-mono text-xs text-muted" title={agent.name}>
              {agent.name}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'capability',
      label: 'Capability',
      sortable: true,
      render: (v) => (
        <span className="rounded-md bg-fg/5 px-2 py-1 font-mono text-xs text-fg/80">{String(v)}</span>
      ),
    },
    {
      key: 'badge',
      label: 'Trust',
      sortable: true,
      render: (_v, agent) => <BadgeTrust badge={trustBadge(agent)} size="sm" />,
    },
    {
      key: 'stakeLamports',
      label: 'Stake',
      sortable: true,
      align: 'right',
      render: (v) => (
        <span className="font-mono tabular-nums">
          {(Number(v) / 1_000_000_000).toFixed(2)} <span className="text-muted">SOL</span>
        </span>
      ),
    },
    {
      key: 'passes',
      label: 'Pass rate',
      sortable: true,
      render: (_v, agent) => {
        const rate = passRate(agent);
        if (rate === null) return <span className="text-xs text-muted">No challenges</span>;
        const tone = rate >= 90 ? 'bg-ok' : rate >= 70 ? 'bg-warn' : 'bg-bad';
        return (
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-fg/10">
              <div className={`h-full rounded-full ${tone}`} style={{ width: `${rate}%` }} />
            </div>
            <span className="font-mono text-xs tabular-nums text-muted">{rate.toFixed(0)}%</span>
          </div>
        );
      },
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (v) => <span className="font-mono text-xs text-muted">{shortenAddress(String(v), 4, 4)}</span>,
    },
  ];

  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="hero">
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-20 text-center sm:pt-28">
          <div className="fade-up inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3.5 py-1.5 text-xs font-medium text-muted backdrop-blur">
            <span className="ping-dot relative h-1.5 w-1.5 rounded-full bg-ok" />
            Live on Solana {activeCluster.label}
          </div>

          <h1 className="fade-up delay-1 mx-auto mt-7 max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            Check an agent <span className="text-gradient">before you trust it</span>
          </h1>
          <p className="fade-up delay-2 mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted">
            Search any agent name, capability or owner wallet and verify its stake, endpoint and on-chain track record in
            seconds.
          </p>

          <div className="fade-up delay-3 mx-auto mt-10 max-w-2xl">
            <div className="glass group relative flex items-center rounded-2xl p-1.5 shadow-2xl shadow-accent/10 transition-shadow focus-within:border-accent/50 focus-within:shadow-accent/25">
              <Search className="pointer-events-none ml-4 h-5 w-5 shrink-0 text-muted" />
              <input
                id="hero-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agent name, capability or owner wallet…"
                className="h-12 w-full bg-transparent px-3 text-base outline-none placeholder:text-muted/70"
                aria-label="Search agents"
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-fg/10 hover:text-fg"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <a href="#agents" className="btn-primary hidden h-12 shrink-0 items-center rounded-xl px-6 text-sm font-medium sm:inline-flex">
                Search
              </a>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-muted">{all.length ? 'Try' : 'e.g.'}</span>
              {(all.length ? all.slice(0, 3).map((a) => a.name) : SHOWCASE).map((ex) => (
                <button
                  key={ex}
                  onClick={() => setSearchQuery(ex)}
                  className="rounded-full border border-line bg-surface/50 px-3 py-1.5 font-mono text-[11px] text-fg/80 transition-colors hover:border-accent/50 hover:bg-accent/10 hover:text-fg"
                >
                  {ex.replace(/^[a-z0-9]+:\/\//, '')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Stats ───────── */}
      <section className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="fade-up">
            <StatCard title="Total agents" value={stats.totalAgents} subtitle="Registered on-chain" icon={Bot} />
          </div>
          <div className="fade-up delay-1">
            <StatCard title="Total staked" value={Number(stats.totalStakedSOL.toFixed(2))} subtitle="SOL locked" icon={Coins} />
          </div>
          <div className="fade-up delay-2">
            <StatCard title="Verified agents" value={stats.verifiedAgents} subtitle="Endpoint verified" icon={BadgeCheck} />
          </div>
          <div className="fade-up delay-3">
            <StatCard title="Recent txs" value={stats.recentTxs} subtitle="Last 50 signatures" icon={Activity} />
          </div>
        </div>
      </section>

      {/* ───────── Agents + Activity ───────── */}
      <section id="agents" className="mx-auto mt-16 max-w-7xl scroll-mt-24 px-6">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Trusted agents</h2>
            <p className="mt-1 text-sm text-muted">Read live from the AgentNS program on {activeCluster.label}.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-4">
            {/* Filter bar */}
            <div className="card flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Capability filter">
                {[undefined, ...capabilities].map((cap) => {
                  const active = filters.capability === cap;
                  return (
                    <button
                      key={cap ?? 'all'}
                      onClick={() => setFilters((prev) => ({ ...prev, capability: cap }))}
                      aria-pressed={active}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? 'bg-accent text-white shadow-md shadow-accent/30'
                          : 'border border-line bg-fg/[0.03] text-muted hover:border-line-strong hover:text-fg'
                      }`}
                    >
                      {cap ?? 'All'}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <label className="flex items-center gap-3 text-xs text-muted">
                  Min stake
                  <input
                    type="range"
                    min={0}
                    max={maxStake}
                    step={0.1}
                    value={filters.minStake}
                    onChange={(e) => setFilters((prev) => ({ ...prev, minStake: Number(e.target.value) }))}
                    className="w-24 accent-accent"
                  />
                  <span className="w-12 font-mono tabular-nums text-fg">{filters.minStake} SOL</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2.5 text-xs text-muted">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!!filters.showRevoked}
                    onClick={() => setFilters((prev) => ({ ...prev, showRevoked: !prev.showRevoked }))}
                    className={`relative h-5 w-9 rounded-full transition-colors ${
                      filters.showRevoked ? 'bg-accent' : 'bg-fg/15'
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        filters.showRevoked ? 'translate-x-4' : ''
                      }`}
                    />
                  </button>
                  Show revoked
                </label>

                {hasActiveFilters && (
                  <button onClick={resetAll} className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline">
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                )}
              </div>
            </div>

            {error && (
              <Alert tone="error" title="Couldn’t load agents from the network">
                {error instanceof Error ? error.message : String(error)}{' '}
                <button onClick={() => mutate()} className="underline">
                  Retry
                </button>
                . The public devnet RPC is rate-limited — set a dedicated URL in VITE_SOLANA_RPC_URL if this keeps happening.
              </Alert>
            )}

            {!error && !isLoading && all.length === 0 ? (
              <div className="card">
                <EmptyState
                  title="No agents registered yet"
                  description={`Nothing found for program ${shortenAddress(agentnsProgramId, 4, 4)} on ${activeCluster.label}. Be the first to register one.`}
                />
                <div className="-mt-8 pb-12 text-center">
                  <Link href="/register" className="btn-primary inline-flex h-10 items-center rounded-xl px-5 text-sm font-medium">
                    Register an agent
                  </Link>
                </div>
              </div>
            ) : (
              <DataTable
                title="Agents"
                data={rows}
                columns={columns}
                skeletonCount={8}
                loading={isLoading}
                getRowKey={(a) => a.pda}
                onRowClick={(a) => router.push(`/names/${a.pda}`)}
                emptyMessage="No agents match your filters"
              />
            )}
          </div>

          <aside className="min-w-0">
            <div className="card lg:sticky lg:top-24">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h3 className="text-base font-semibold tracking-tight">Latest activity</h3>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                  <span className="ping-dot relative h-1.5 w-1.5 rounded-full bg-ok" />
                  Live
                </span>
              </div>
              <ScrollableFeed />
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
