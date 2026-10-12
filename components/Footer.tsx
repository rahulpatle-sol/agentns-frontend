import Link from 'next/link';
import { activeCluster, agentnsProgramId, explorerAddressUrl } from '@/lib/config';

const cols = [
  {
    title: 'Explore',
    links: [
      { label: 'Registry', href: '/' },
      { label: 'Activity', href: '/activity' },
    ],
  },
  {
    title: 'Build',
    links: [
      { label: 'Register a name', href: '/register' },
      { label: 'My names', href: '/names' },
      { label: 'Registry setup', href: '/admin' },
    ],
  },
  {
    title: 'Program',
    links: [
      { label: 'Solana Explorer ↗', href: explorerAddressUrl(agentnsProgramId), external: true },
      { label: 'Source ↗', href: 'https://github.com/rahulpatle-sol/agentns', external: true },
      { label: 'Faucet ↗', href: 'https://faucet.solana.com', external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-line-strong">
      <div className="mx-auto grid max-w-[1500px] gap-12 px-5 pb-10 pt-14 sm:px-8 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <p className="font-display max-w-sm text-3xl leading-[1.1]">
          A name, a stake, a track record —<br />
          <em className="text-accent">for every machine.</em>
        </p>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="eyebrow">{c.title}</h4>
            <ul className="mt-5 space-y-3">
              {c.links.map((l) => (
                <li key={l.label}>
                  {'external' in l && l.external ? (
                    <a href={l.href} target="_blank" rel="noreferrer" className="link-u text-sm">{l.label}</a>
                  ) : (
                    <Link href={l.href} className="link-u text-sm">{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 pb-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted sm:px-8">
        <span>© AgentNS</span>
        <span className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${activeCluster.isTestnet ? 'bg-warn' : 'bg-ok'}`} />
          {activeCluster.isTestnet ? `${activeCluster.label} · test funds only` : 'Mainnet · real funds'}
        </span>
      </div>

      <p aria-hidden className="font-display pointer-events-none select-none whitespace-nowrap text-center text-[clamp(6rem,27vw,26rem)] leading-[0.74] tracking-[-0.04em] text-fg/[0.07]">
        AgentNS
      </p>
    </footer>
  );
}
