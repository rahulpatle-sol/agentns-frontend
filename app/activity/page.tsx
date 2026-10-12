'use client';

import { PageHeader } from '@/components/ui/Form';
import { ScrollableFeed } from '@/components/ScrollableFeed';
import { agentnsProgramId, activeCluster, explorerAddressUrl } from '@/lib/config';

export default function ActivityPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-8 pt-12">
      <PageHeader
        eyebrow="Activity"
        title="Program activity"
        lede={`The latest transactions that touched the AgentNS program on ${activeCluster.label}, straight from the RPC node.`}
      />
      <div className="card">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="text-base font-semibold tracking-tight">Latest transactions</h3>
          <a href={explorerAddressUrl(agentnsProgramId)} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
            Program on Explorer ↗
          </a>
        </div>
        <ScrollableFeed limit={30} />
      </div>
    </div>
  );
}
