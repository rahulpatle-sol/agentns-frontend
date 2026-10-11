'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { StatCard } from '@/components/StatCard';
import { ScrollableFeed } from '@/components/ScrollableFeed';
import { listAgents, getStats } from '@/lib/data/provider';
import type { Agent, Filters, Stats } from '@/lib/data/types';
import type { DataTableColumn } from '@/components/DataTable';

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    capability: undefined,
    protocol: undefined,
    badge: undefined,
    minStake: 0,
    showUnverified: false,
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoadingAgents(true);
    setError(null);

    const debounce = setTimeout(() => {
      void listAgents(filters)
        .then((results) => {
          if (!cancelled) setAgents(results);
        })
        .catch((loadError: unknown) => {
          if (!cancelled) {
            setError(loadError instanceof Error ? loadError.message : 'Unable to load agents.');
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingAgents(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(debounce);
    };
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    void getStats()
      .then((result) => {
        if (!cancelled) setStats(result);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load stats.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const lowerSearchQuery = searchQuery.toLowerCase();
  const filteredAgents = agents.filter((agent) =>
    !lowerSearchQuery ||
    agent.name.toLowerCase().includes(lowerSearchQuery) ||
    agent.capability.toLowerCase().includes(lowerSearchQuery) ||
    agent.owner.toLowerCase().includes(lowerSearchQuery)
  );

  const columns: DataTableColumn<Agent>[] = [
    { key: 'name', label: 'Agent', sortable: true },
    { key: 'capability', label: 'Capability', sortable: true },
    { key: 'badge', label: 'Badge', sortable: true },
    {
      key: 'stakeLamports',
      label: 'Stake (SOL)',
      sortable: true,
      render: (value) => `${(Number(value) / 1_000_000_000).toFixed(2)} SOL`,
    },
    { key: 'passes', label: 'Passes', sortable: true },
    { key: 'fails', label: 'Fails', sortable: true },
  ];

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tighter text-explorer mb-4">
            Check an agent before you trust it
          </h1>
          <p className="text-muted text-lg mb-6">
            Search an agent name, capability, or owner wallet to view details
          </p>
          
          {/* Example searches */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button 
              onClick={() => setSearchQuery('mcp://sentiment.text-analysis.acme.v1.0')}
              className="p-2 rounded bg-surface hover:bg-accent/10 transition-colors text-sm text-explorer cursor-pointer"
            >
              mcp://sentiment.text-analysis.acme.v1.0
            </button>
            <button 
              onClick={() => setSearchQuery('mcp://trading-signals.alchemy.v1.0')}
              className="p-2 rounded bg-surface hover:bg-accent/10 transition-colors text-sm text-explorer cursor-pointer"
            >
              mcp://trading-signals.alchemy.v1.0
            </button>
            <button 
              onClick={() => setSearchQuery('mcp://code-review.backend.acme.v1.0')}
              className="p-2 rounded bg-surface hover:bg-accent/10 transition-colors text-sm text-explorer cursor-pointer"
            >
              mcp://code-review.backend.acme.v1.0
            </button>
            <button 
              onClick={() => setSearchQuery('mcp://web-search.lucide.v1.0')}
              className="p-2 rounded bg-surface hover:bg-accent/10 transition-colors text-sm text-explorer cursor-pointer"
            >
              mcp://web-search.lucide.v1.0
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatCard
            title="Total agents"
            value={stats?.totalAgents ?? 0}
            subtitle="Active + Revoked"
          />
          <StatCard
            title="Total staked"
            value={stats?.totalStakedSOL ?? 0}
            subtitle="SOL"
          />
          <StatCard
            title="Verified agents"
            value={stats?.verifiedAgents ?? 0}
            subtitle="with endpoint verified"
          />
          <StatCard
            title="Checks 24h"
            value={stats?.checks24h ?? 0}
            subtitle="on-chain"
          />
        </div>

        {/* Agent Table */}
        <div className="grid grid-cols-1 lg:grid-cols-[350px]_1fr gap-8">
          {/* Left column: Agent Table */}
          <div>
            <h2 className="text-xl font-medium text-explorer mb-4">Trusted agents</h2>
            
            <div className="bg-surface rounded-xl border border-explorer p-4 mb-6">
              <form 
                className="grid grid-cols-2 gap-4 mb-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const capability = formData.get('capability') as string;
                  if (capability) {
                    setFilters(prev => ({ ...prev, capability }));
                  } else {
                    setFilters(prev => ({ ...prev, capability: undefined }));
                  }
                }}
              >
                <select
                  value={filters.capability || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, capability: e.target.value || undefined }))}
                  className="w-full rounded bg-explorer border border-explorer focus:outline-none focus:ring-2 focus:ring-accent py-2 pl-3 text-sm"
                >
                  <option value="">All capabilities</option>
                  <option value="text-analysis">text-analysis</option>
                  <option value="translation">translation</option>
                  <option value="code-review">code-review</option>
                  <option value="web-search">web-search</option>
                  <option value="trading-signals">trading-signals</option>
                </select>
                
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider mb-1">Min stake (SOL)</label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={filters.minStake ?? 0}
                    onChange={(e) => setFilters(prev => ({ ...prev, minStake: Number(e.target.value) }))}
                    className="w-24 accent-color-accent"
                  />
                  <span className="text-xs text-muted ml-2">{filters.minStake ?? 0} SOL</span>
                </div>
              </form>
              
              <div className="flex gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showUnverified}
                    onChange={(e) => setFilters(prev => ({ ...prev, showUnverified: e.target.checked }))}
                    className="rounded border-explorer"
                  />
                  <span className="text-sm text-muted">Show unverified agents</span>
                </label>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-sm text-accent hover underline"
                >
                  Clear filters
                </button>
              </div>
            </div>

            {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
            <DataTable
              data={filteredAgents || []}
              columns={columns}
              skeletonCount={8}
              loading={loadingAgents}
            />
          </div>

          {/* Right column: Latest activity and Top reputation */}
          <div>
            <h2 className="text-xl font-medium text-explorer mb-4">Latest activity</h2>
            <ScrollableFeed />
          </div>
        </div>
      </div>
    </section>
  );
}
