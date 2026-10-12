import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { activeCluster, agentnsProgramId, explorerAddressUrl } from '@/lib/config';

const columns = [
  {
    title: 'Explorer',
    links: [
      { label: 'Agents', href: '/' },
      { label: 'Register a name', href: '/register' },
      { label: 'My names', href: '/names' },
      { label: 'Activity', href: '/activity' },
    ],
  },
  {
    title: 'Program',
    links: [
      { label: 'View on Solana Explorer', href: explorerAddressUrl(agentnsProgramId), external: true },
      { label: 'Source on GitHub', href: 'https://github.com/rahulpatle-sol/agentns', external: true },
    ],
  },
  {
    title: 'Network',
    links: [
      { label: 'Devnet faucet', href: 'https://faucet.solana.com', external: true },
      { label: 'Solana status', href: 'https://status.solana.com', external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white">
              <ShieldCheck className="h-4 w-4" />
            </span>
            AgentNS
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            The on-chain name registry and trust layer for AI agents. Verify before you call.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs font-medium uppercase tracking-widest text-muted">{col.title}</h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  {'external' in link && link.external ? (
                    <a href={link.href} target="_blank" rel="noreferrer" className="text-sm text-fg/80 transition-colors hover:text-fg">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-sm text-fg/80 transition-colors hover:text-fg">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-muted sm:flex-row">
          <span>© AgentNS. All rights reserved.</span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-warn" />
            {activeCluster.isTestnet ? `${activeCluster.label} only. Test money.` : 'Mainnet — real funds.'}
          </span>
        </div>
      </div>
    </footer>
  );
}
