'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Address } from '@solana/kit';
import { Fingerprint, Hash, Wallet } from 'lucide-react';

import { Alert, Button, Field, Input, PageHeader, Select } from '@/components/ui/Form';
import { activeCluster, explorerAddressUrl } from '@/lib/config';
import { bytesToHex, formatSol, parseSol, shortenAddress } from '@/lib/format';
import { PROTOCOLS, PROTOCOL_LABEL, buildName, type Protocol } from '@/lib/program/constants';
import { agentPdaForName, getRegisterNameInstruction, hashName } from '@/lib/program/agentns';
import {
  looksLikeAddress,
  validateEndpoint,
  validateMetadataUri,
  validatePart,
  validateVersion,
  type ValidationResult,
} from '@/lib/program/validation';
import { useRegistryConfig } from '@/lib/state/queries';
import { useTransaction } from '@/lib/state/transactions/useTransaction';
import { useWallet } from '@/lib/state/wallet';
import { useSWRConfig } from 'swr';

type FormState = {
  protocol: Protocol;
  agentId: string;
  capability: string;
  provider: string;
  version: string;
  endpoint: string;
  agentPubkey: string;
  metadataUri: string;
  stakeSol: string;
};

const INITIAL: FormState = {
  protocol: 'mcp',
  agentId: '',
  capability: '',
  provider: '',
  version: '1.0',
  endpoint: '',
  agentPubkey: '',
  metadataUri: '',
  stakeSol: '',
};

export default function RegisterPage() {
  const wallet = useWallet();
  const { mutate } = useSWRConfig();
  const { config, configAddress, isLoading: configLoading, error: configError } = useRegistryConfig();
  const tx = useTransaction();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<{ name: string; hash: string; pda: string } | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((c) => ({ ...c, [key]: value }));
    setTouched((c) => ({ ...c, [key]: true }));
  };

  const fullName = buildName(form.protocol, form.agentId, form.capability, form.provider, form.version);

  const partsValid =
    validatePart('Agent ID', form.agentId).ok &&
    validatePart('Capability', form.capability).ok &&
    validatePart('Provider', form.provider).ok &&
    validateVersion(form.version).ok;

  // Hash + PDA are computed locally and shown before signing.
  useEffect(() => {
    if (!partsValid) return;
    let cancelled = false;
    void (async () => {
      const [hash, pda] = await Promise.all([hashName(fullName), agentPdaForName(fullName)]);
      if (!cancelled) setPreview({ name: fullName, hash: bytesToHex(hash), pda });
    })();
    return () => {
      cancelled = true;
    };
  }, [fullName, partsValid]);

  const livePreview = partsValid && preview?.name === fullName ? preview : null;

  const errors = useMemo(
    () => ({
      agentId: validatePart('Agent ID', form.agentId),
      capability: validatePart('Capability', form.capability),
      provider: validatePart('Provider', form.provider),
      version: validateVersion(form.version),
      endpoint: validateEndpoint(form.endpoint),
      metadataUri: validateMetadataUri(form.metadataUri),
      agentPubkey:
        form.agentPubkey.length === 0 || looksLikeAddress(form.agentPubkey)
          ? ({ ok: true } as const)
          : ({ ok: false, message: 'That does not look like a Solana address.' } as const),
    }),
    [form],
  );

  const stake = parseSol(form.stakeSol);
  const minStake = config?.minStakeLamports ?? 0n;
  const fee = config?.registrationFeeLamports ?? 0n;
  const total = fee + (stake ?? 0n);
  const hasFormError = Object.values(errors).some((r) => !r.ok);
  const complete = !!(form.agentId && form.capability && form.provider && form.endpoint && livePreview);

  const blockedReason = (() => {
    if (!wallet.isConnected) return 'Connect a wallet to register a name.';
    if (configLoading) return 'Reading registry config…';
    if (configError) return 'Cannot reach the RPC endpoint.';
    if (!config) return 'The registry is not initialised on this cluster yet, so registration is unavailable.';
    if (hasFormError) return 'Fix the highlighted fields to continue.';
    if (!complete) return 'Fill in every required field.';
    if (stake === null) return 'Enter a valid SOL amount for the stake.';
    if (stake < minStake) return `Stake must be at least ${formatSol(minStake)}.`;
    return null;
  })();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockedReason || !config || !configAddress || !wallet.address || stake === null) return;

    const [hashBytes, recordPda] = await Promise.all([hashName(fullName), agentPdaForName(fullName)]);
    const ix = await getRegisterNameInstruction(
      {
        nameHash: hashBytes,
        protocol: form.protocol,
        agentId: form.agentId,
        capability: form.capability,
        provider: form.provider,
        version: form.version,
        endpoint: form.endpoint,
        agentPubkey: (form.agentPubkey || wallet.address) as Address,
        metadataUri: form.metadataUri,
        stakeLamports: stake,
      },
      { owner: wallet.address, config: configAddress, treasury: config.treasury, agentRecord: recordPda },
    );

    const sig = await tx.send(ix, {
      pendingTitle: `Registering ${fullName}`,
      successTitle: `${fullName} registered`,
      action: 'Registering this name',
      onConfirmed: () => {
        setForm(INITIAL);
        setTouched({});
        void mutate((k) => Array.isArray(k) ? String(k[0]).startsWith('agentns:') : k === 'agentns:all-agents');
      },
    });
    if (sig) setTouched({});
  };

  const err = (key: keyof FormState, r: ValidationResult) => (touched[key] && !r.ok ? r.message : undefined);

  return (
    <div className="mx-auto max-w-7xl px-6 pb-8 pt-12">
      <PageHeader
        eyebrow="Register"
        title="Register an agent name"
        lede="Your name is built from five parts and hashed on-chain. Check the preview before signing — the record account is created at the PDA shown on the right."
      />

      {!activeCluster.isTestnet && (
        <div className="mb-6">
          <Alert tone="warning" title="You are on mainnet">
            This registration sends real SOL. Revoking keeps the name reserved but does not return the stake.
          </Alert>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-base font-semibold tracking-tight">Name</h2>
            <p className="mt-1 text-xs text-muted">Lowercase letters, digits and hyphens · 1–32 characters per part.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Protocol" required>
                {({ id }) => (
                  <Select id={id} value={form.protocol} onChange={(e) => set('protocol', e.target.value as Protocol)}>
                    {PROTOCOLS.map((p) => (
                      <option key={p} value={p}>
                        {PROTOCOL_LABEL[p]} ({p}://)
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Version" required hint="e.g. 1.0 or 1.2.3" error={err('version', errors.version)}>
                {({ id, invalid }) => <Input id={id} invalid={invalid} value={form.version} onChange={(e) => set('version', e.target.value)} placeholder="1.0" />}
              </Field>
              <Field label="Agent ID" required error={err('agentId', errors.agentId)}>
                {({ id, invalid }) => <Input id={id} invalid={invalid} value={form.agentId} onChange={(e) => set('agentId', e.target.value.toLowerCase())} placeholder="sentiment" autoComplete="off" />}
              </Field>
              <Field label="Capability" required error={err('capability', errors.capability)}>
                {({ id, invalid }) => <Input id={id} invalid={invalid} value={form.capability} onChange={(e) => set('capability', e.target.value.toLowerCase())} placeholder="text-analysis" autoComplete="off" />}
              </Field>
              <Field label="Provider" required error={err('provider', errors.provider)}>
                {({ id, invalid }) => <Input id={id} invalid={invalid} value={form.provider} onChange={(e) => set('provider', e.target.value.toLowerCase())} placeholder="acme" autoComplete="off" />}
              </Field>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-base font-semibold tracking-tight">Endpoint &amp; metadata</h2>
            <div className="mt-5 space-y-4">
              <Field label="Endpoint URL" required hint="Must start with https://" error={err('endpoint', errors.endpoint)}>
                {({ id, invalid }) => <Input id={id} invalid={invalid} value={form.endpoint} onChange={(e) => set('endpoint', e.target.value.trim())} placeholder="https://sentiment.acme.dev/analyze" inputMode="url" />}
              </Field>
              <Field label="Agent public key" hint="Optional — defaults to your connected wallet." error={err('agentPubkey', errors.agentPubkey)}>
                {({ id, invalid }) => <Input id={id} invalid={invalid} className="font-mono" value={form.agentPubkey} onChange={(e) => set('agentPubkey', e.target.value.trim())} placeholder={wallet.address ?? 'Solana address'} />}
              </Field>
              <Field label="Metadata URI" hint="Optional — ipfs://… or https://…" error={err('metadataUri', errors.metadataUri)}>
                {({ id, invalid }) => <Input id={id} invalid={invalid} value={form.metadataUri} onChange={(e) => set('metadataUri', e.target.value.trim())} placeholder="ipfs://…" />}
              </Field>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-base font-semibold tracking-tight">Stake</h2>
            <p className="mt-1 text-xs text-muted">SOL locked behind your name. {config ? `Minimum ${formatSol(minStake)}.` : ''}</p>
            <div className="mt-5 max-w-xs">
              <Field label="Stake (SOL)" required error={form.stakeSol && stake === null ? 'Enter a valid number.' : touched.stakeSol && stake !== null && config && stake < minStake ? `At least ${formatSol(minStake)}.` : undefined}>
                {({ id, invalid }) => (
                  <Input id={id} invalid={invalid} inputMode="decimal" value={form.stakeSol} onChange={(e) => set('stakeSol', e.target.value)} placeholder={config ? String(Number(minStake) / 1e9) : '0.5'} />
                )}
              </Field>
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <Fingerprint className="h-4 w-4 text-accent" /> Preview
            </h2>
            <p className="mt-4 break-all font-mono text-sm">{partsValid ? fullName : <span className="text-muted">Fill in the name parts…</span>}</p>
            <dl className="mt-5 space-y-3 text-xs">
              <div>
                <dt className="flex items-center gap-1.5 text-muted"><Hash className="h-3 w-3" /> SHA-256</dt>
                <dd className="mt-1 break-all font-mono">{livePreview?.hash ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted">Record PDA</dt>
                <dd className="mt-1 break-all font-mono">
                  {livePreview ? (
                    <a href={explorerAddressUrl(livePreview.pda)} target="_blank" rel="noreferrer" className="hover:text-accent">
                      {livePreview.pda}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="card p-6">
            <h2 className="text-base font-semibold tracking-tight">Cost</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Row label="Registration fee" value={config ? formatSol(fee) : '—'} />
              <Row label="Stake" value={stake !== null ? formatSol(stake) : '—'} />
              <div className="my-2 h-px bg-line" />
              <Row label="Total (+ network fee)" value={config && stake !== null ? formatSol(total) : '—'} strong />
            </dl>
            {config && (
              <p className="mt-4 text-xs text-muted">
                Fee goes to treasury <span className="font-mono">{shortenAddress(config.treasury, 4, 4)}</span>.
              </p>
            )}
          </section>

          {blockedReason && wallet.isConnected && <Alert tone="info" title={blockedReason} />}
          {!wallet.isConnected && (
            <Alert tone="info" title="Connect a wallet to register a name.">
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" /> Use the button at the top right.
              </span>
            </Alert>
          )}
          {tx.state.phase === 'error' && tx.state.error && <Alert tone={tx.state.error.isUserRejection ? 'info' : 'error'} title={tx.state.error.title}>{tx.state.error.message}</Alert>}

          <Button type="submit" className="h-12 w-full text-base" disabled={!!blockedReason} loading={tx.isBusy}>
            {tx.isBusy ? 'Waiting for confirmation…' : 'Register name'}
          </Button>
        </aside>
      </form>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-mono tabular-nums ${strong ? 'font-semibold' : ''}`}>{value}</dd>
    </div>
  );
}
