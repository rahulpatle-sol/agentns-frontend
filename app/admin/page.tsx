'use client';

import { useState } from 'react';
import type { Address } from '@solana/kit';
import { useSWRConfig } from 'swr';

import { Alert, Button, Field, Input, PageHeader } from '@/components/ui/Form';
import { Address as AddressChip } from '@/components/Address';
import { activeCluster } from '@/lib/config';
import { formatBps, formatDuration, formatSol, parseSol } from '@/lib/format';
import { configPda, getInitializeConfigInstruction } from '@/lib/program/agentns';
import { looksLikeAddress } from '@/lib/program/validation';
import { useRegistryConfig } from '@/lib/state/queries';
import { useTransaction } from '@/lib/state/transactions/useTransaction';
import { useWallet } from '@/lib/state/wallet';

export default function AdminPage() {
  const wallet = useWallet();
  const { mutate } = useSWRConfig();
  const { config, configAddress, isLoading, error } = useRegistryConfig();
  const tx = useTransaction();

  const [treasury, setTreasury] = useState('');
  const [resolver, setResolver] = useState('');
  const [fee, setFee] = useState('0.01');
  const [minStake, setMinStake] = useState('0.1');
  const [slashBps, setSlashBps] = useState('1000');
  const [cooldown, setCooldown] = useState('604800');
  const [mktBps, setMktBps] = useState('250');

  const treasuryAddr = treasury || wallet.address || '';
  const resolverAddr = resolver || wallet.address || '';

  const feeL = parseSol(fee);
  const minL = parseSol(minStake);
  const slash = Number(slashBps);
  const mkt = Number(mktBps);
  const cool = Number(cooldown);

  const problem = (() => {
    if (!wallet.isConnected) return 'Connect a wallet first.';
    if (!looksLikeAddress(treasuryAddr)) return 'Treasury is not a valid address.';
    if (!looksLikeAddress(resolverAddr)) return 'Resolver key is not a valid address.';
    if (feeL === null || minL === null) return 'Fee and min stake must be valid SOL amounts.';
    if (!Number.isInteger(slash) || slash < 0 || slash > 10_000) return 'Slash must be 0–10000 bps.';
    if (!Number.isInteger(mkt) || mkt < 0 || mkt > 1_000) return 'Marketplace fee must be 0–1000 bps (max 10%).';
    if (!Number.isInteger(cool) || cool < 0) return 'Cooldown must be a non-negative number of seconds.';
    return null;
  })();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (problem || !wallet.address || feeL === null || minL === null) return;
    const ix = await getInitializeConfigInstruction(
      {
        treasury: treasuryAddr as Address,
        resolverPubkey: resolverAddr as Address,
        registrationFeeLamports: feeL,
        minStakeLamports: minL,
        slashBps: slash,
        unstakeCooldownSecs: BigInt(cool),
        marketplaceFeeBps: mkt,
      },
      { admin: wallet.address, config: await configPda() },
    );
    await tx.send(ix, {
      pendingTitle: 'Initialising registry',
      successTitle: 'Registry initialised',
      action: 'Initialising the registry',
      onConfirmed: () => void mutate('agentns:config'),
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-6 pb-8 pt-12">
      <PageHeader
        eyebrow="Admin"
        title="Registry setup"
        lede={`One-time setup of the registry config on ${activeCluster.label}. Registration stays disabled until this exists.`}
      />

      {isLoading ? (
        <div className="skeleton h-48" />
      ) : error ? (
        <Alert tone="error" title="Couldn’t read the registry config">{error.message}</Alert>
      ) : config ? (
        <div className="card space-y-4 p-6">
          <Alert tone="info" title="The registry is already initialised." />
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Row label="Config account">{configAddress && <AddressChip address={configAddress} />}</Row>
            <Row label="Admin"><AddressChip address={config.admin} /></Row>
            <Row label="Treasury"><AddressChip address={config.treasury} /></Row>
            <Row label="Resolver key"><AddressChip address={config.resolverPubkey} /></Row>
            <Row label="Registration fee">{formatSol(config.registrationFeeLamports)}</Row>
            <Row label="Min stake">{formatSol(config.minStakeLamports)}</Row>
            <Row label="Slash">{formatBps(config.slashBps)}</Row>
            <Row label="Unstake cooldown">{formatDuration(config.unstakeCooldownSecs)}</Row>
            <Row label="Marketplace fee">{formatBps(config.marketplaceFeeBps)}</Row>
          </dl>
        </div>
      ) : (
        <form onSubmit={submit} className="card space-y-5 p-6">
          <Alert tone="warning" title="The wallet that signs becomes the admin — permanently.">
            Use the wallet you want to control the registry. Double-check the values; changing them later needs the admin wallet.
          </Alert>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Treasury address" hint="Receives registration fees. Defaults to your wallet.">
              {({ id }) => <Input id={id} className="font-mono" value={treasury} onChange={(e) => setTreasury(e.target.value.trim())} placeholder={wallet.address ?? 'Wallet address'} />}
            </Field>
            <Field label="Resolver key" hint="Defaults to your wallet.">
              {({ id }) => <Input id={id} className="font-mono" value={resolver} onChange={(e) => setResolver(e.target.value.trim())} placeholder={wallet.address ?? 'Wallet address'} />}
            </Field>
            <Field label="Registration fee (SOL)">{({ id }) => <Input id={id} inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} />}</Field>
            <Field label="Min stake (SOL)">{({ id }) => <Input id={id} inputMode="decimal" value={minStake} onChange={(e) => setMinStake(e.target.value)} />}</Field>
            <Field label="Slash (bps)" hint="1000 = 10%">{({ id }) => <Input id={id} inputMode="numeric" value={slashBps} onChange={(e) => setSlashBps(e.target.value)} />}</Field>
            <Field label="Unstake cooldown (seconds)" hint="604800 = 7 days">{({ id }) => <Input id={id} inputMode="numeric" value={cooldown} onChange={(e) => setCooldown(e.target.value)} />}</Field>
            <Field label="Marketplace fee (bps)" hint="250 = 2.5%, max 1000">{({ id }) => <Input id={id} inputMode="numeric" value={mktBps} onChange={(e) => setMktBps(e.target.value)} />}</Field>
          </div>
          {problem && wallet.isConnected && <Alert tone="info" title={problem} />}
          {tx.state.phase === 'error' && tx.state.error && <Alert tone={tx.state.error.isUserRejection ? 'info' : 'error'} title={tx.state.error.title}>{tx.state.error.message}</Alert>}
          <Button type="submit" disabled={!!problem} loading={tx.isBusy} className="h-11 w-full">Initialise registry</Button>
        </form>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-widest text-muted">{label}</dt>
      <dd className="mt-1.5">{children}</dd>
    </div>
  );
}