'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Address } from '@solana/kit';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useSWRConfig } from 'swr';

import { AgentAvatar } from '@/components/AgentAvatar';
import { BadgeTrust } from '@/components/BadgeTrust';
import { EmptyState } from '@/components/EmptyState';
import { Address as AddressChip } from '@/components/Address';
import { Alert, Button, Field, Input } from '@/components/ui/Form';
import { explorerAddressUrl } from '@/lib/config';
import { bytesToHex, formatSol, formatTimestamp } from '@/lib/format';
import { getRevokeNameInstruction, getTransferNameInstruction, getUpdateEndpointInstruction } from '@/lib/program/agentns';
import { looksLikeAddress, validateEndpoint, validateMetadataUri } from '@/lib/program/validation';
import { useAgentRecord } from '@/lib/state/queries';
import { useTransaction } from '@/lib/state/transactions/useTransaction';
import { useWallet } from '@/lib/state/wallet';
import { passRate, trustBadge } from '@/lib/trust';

export function NameDetail({ pda }: { pda: string }) {
  const valid = looksLikeAddress(pda);
  const address = valid ? (pda as Address) : null;
  const { data: record, error, isLoading, mutate } = useAgentRecord(address);
  const { mutate: globalMutate } = useSWRConfig();
  const wallet = useWallet();
  const tx = useTransaction();

  const isOwner = !!record && !!wallet.address && record.owner === wallet.address;
  const refresh = () => {
    void mutate();
    void globalMutate((k) => Array.isArray(k) && String(k[0]).startsWith('agentns:'));
  };

  if (!valid || (!isLoading && !error && !record)) {
    return (
      <Shell>
        <div className="card">
          <EmptyState title="Name not found" description="No agent record exists at this address on the current cluster." />
        </div>
      </Shell>
    );
  }
  if (error) {
    return (
      <Shell>
        <Alert tone="error" title="Couldn’t load this name">{error instanceof Error ? error.message : String(error)}</Alert>
      </Shell>
    );
  }
  if (isLoading || !record) {
    return (
      <Shell>
        <div className="skeleton h-72" />
      </Shell>
    );
  }

  const rate = passRate(record);

  return (
    <Shell>
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <AgentAvatar name={record.agentId} size={56} />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold capitalize tracking-tight">{record.agentId}</h1>
              <p className="mt-1 break-all font-mono text-xs text-muted">{record.name}</p>
            </div>
          </div>
          <BadgeTrust badge={trustBadge(record)} />
        </div>

        <dl className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <Item label="Capability" value={<span className="font-mono">{record.capability}</span>} />
          <Item label="Provider" value={<span className="font-mono">{record.provider}</span>} />
          <Item label="Version" value={<span className="font-mono">v{record.version}</span>} />
          <Item label="Stake" value={<span className="font-mono">{formatSol(record.stakeLamports)}</span>} />
          <Item label="Challenges" value={<span className="font-mono">{record.passes} pass · {record.fails} fail{rate !== null ? ` (${rate.toFixed(0)}%)` : ''}</span>} />
          <Item label="Endpoint verified" value={record.endpointVerified ? 'Yes' : 'No'} />
          <Item label="Owner" value={<AddressChip address={record.owner} />} />
          <Item label="Agent key" value={<AddressChip address={record.agentPubkey} />} />
          <Item label="Record PDA" value={<AddressChip address={pda} />} />
          <Item label="Registered" value={formatTimestamp(record.registeredAt)} />
          <Item label="Updated" value={formatTimestamp(record.updatedAt)} />
          <Item label="Status" value={<span className="capitalize">{record.status}</span>} />
        </dl>

        <div className="mt-6 space-y-3 border-t border-line pt-6 text-sm">
          <Link2 label="Endpoint" href={record.endpoint} />
          {record.metadataUri && <Link2 label="Metadata" href={record.metadataUri} />}
          <p className="break-all text-xs text-muted">
            Name hash <span className="font-mono">{bytesToHex(record.nameHash)}</span>
          </p>
          <a href={explorerAddressUrl(pda)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
            View account on Explorer <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {tx.state.phase === 'error' && tx.state.error && (
        <div className="mt-6">
          <Alert tone={tx.state.error.isUserRejection ? 'info' : 'error'} title={tx.state.error.title}>{tx.state.error.message}</Alert>
        </div>
      )}

      {isOwner && record.status === 'active' ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <UpdateEndpoint record={record} pda={pda as Address} owner={wallet.address!} tx={tx} onDone={refresh} />
          <div className="space-y-6">
            <Transfer record={record} pda={pda as Address} owner={wallet.address!} tx={tx} onDone={refresh} />
            <Revoke pda={pda as Address} owner={wallet.address!} tx={tx} onDone={refresh} />
          </div>
        </div>
      ) : isOwner ? (
        <div className="mt-6"><Alert tone="warning" title="This name is revoked">It stays reserved but can no longer be edited or transferred.</Alert></div>
      ) : (
        <p className="mt-6 text-center text-xs text-muted">
          {wallet.isConnected ? 'Only the owner of this name can edit it.' : 'Connect the owner wallet to manage this name.'}
        </p>
      )}
    </Shell>
  );
}

type Tx = ReturnType<typeof useTransaction>;
type Rec = NonNullable<ReturnType<typeof useAgentRecord>['data']>;
type ActionProps = { record?: Rec; pda: Address; owner: Address; tx: Tx; onDone: () => void };

function UpdateEndpoint({ record, pda, owner, tx, onDone }: ActionProps & { record: Rec }) {
  const [endpoint, setEndpoint] = useState(record.endpoint);
  const [agentPubkey, setAgentPubkey] = useState<string>(record.agentPubkey);
  const [metadataUri, setMetadataUri] = useState(record.metadataUri);

  const epErr = validateEndpoint(endpoint);
  const muErr = validateMetadataUri(metadataUri);
  const pkOk = looksLikeAddress(agentPubkey);
  const changed = endpoint !== record.endpoint || agentPubkey !== record.agentPubkey || metadataUri !== record.metadataUri;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!epErr.ok || !muErr.ok || !pkOk || !changed) return;
    const ix = await getUpdateEndpointInstruction({ endpoint, agentPubkey: agentPubkey as Address, metadataUri }, { owner, agentRecord: pda });
    await tx.send(ix, { pendingTitle: 'Updating endpoint', successTitle: 'Endpoint updated', action: 'Updating this name', onConfirmed: onDone });
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <h2 className="text-base font-semibold tracking-tight">Update endpoint</h2>
      <Field label="Endpoint URL" error={!epErr.ok ? epErr.message : undefined}>
        {({ id, invalid }) => <Input id={id} invalid={invalid} value={endpoint} onChange={(e) => setEndpoint(e.target.value.trim())} />}
      </Field>
      <Field label="Agent public key" error={!pkOk ? 'Not a valid Solana address.' : undefined}>
        {({ id, invalid }) => <Input id={id} invalid={invalid} className="font-mono" value={agentPubkey} onChange={(e) => setAgentPubkey(e.target.value.trim())} />}
      </Field>
      <Field label="Metadata URI" error={!muErr.ok ? muErr.message : undefined}>
        {({ id, invalid }) => <Input id={id} invalid={invalid} value={metadataUri} onChange={(e) => setMetadataUri(e.target.value.trim())} />}
      </Field>
      <Button type="submit" disabled={!changed || !epErr.ok || !muErr.ok || !pkOk} loading={tx.isBusy}>Save changes</Button>
    </form>
  );
}

function Transfer({ record, pda, owner, tx, onDone }: ActionProps & { record: Rec }) {
  const [to, setTo] = useState('');
  const [touched, setTouched] = useState(false);
  const error = !looksLikeAddress(to) ? 'Enter a valid Solana address.' : to === record.owner ? 'The new owner must be a different wallet.' : undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (error) return;
    const ix = await getTransferNameInstruction(to as Address, { owner, agentRecord: pda });
    await tx.send(ix, { pendingTitle: 'Transferring name', successTitle: 'Name transferred', action: 'Transferring this name', onConfirmed: onDone });
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <h2 className="text-base font-semibold tracking-tight">Transfer ownership</h2>
      <Field label="New owner" error={touched ? error : undefined} hint="You lose the ability to manage this name.">
        {({ id, invalid }) => <Input id={id} invalid={invalid} className="font-mono" value={to} onChange={(e) => setTo(e.target.value.trim())} placeholder="Wallet address" />}
      </Field>
      <Button type="submit" variant="ghost" loading={tx.isBusy} disabled={to.length === 0}>Transfer</Button>
    </form>
  );
}

function Revoke({ pda, owner, tx, onDone }: Omit<ActionProps, 'record'>) {
  const [confirm, setConfirm] = useState(false);
  const run = async () => {
    const ix = await getRevokeNameInstruction({ owner, agentRecord: pda });
    await tx.send(ix, { pendingTitle: 'Revoking name', successTitle: 'Name revoked', action: 'Revoking this name', onConfirmed: onDone });
    setConfirm(false);
  };
  return (
    <div className="card space-y-3 border-bad/20 p-6">
      <h2 className="text-base font-semibold tracking-tight text-bad">Danger zone</h2>
      <p className="text-xs text-muted">Revoking keeps the name reserved forever but disables it. This can’t be undone.</p>
      {confirm ? (
        <div className="flex gap-2">
          <Button variant="danger" onClick={run} loading={tx.isBusy}>Yes, revoke</Button>
          <Button variant="ghost" onClick={() => setConfirm(false)} disabled={tx.isBusy}>Cancel</Button>
        </div>
      ) : (
        <Button variant="danger" onClick={() => setConfirm(true)}>Revoke name</Button>
      )}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-8 pt-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> All agents
      </Link>
      {children}
    </div>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-widest text-muted">{label}</dt>
      <dd className="mt-1.5 text-sm">{value}</dd>
    </div>
  );
}

function Link2({ label, href }: { label: string; href: string }) {
  const safe = /^https?:\/\//.test(href);
  return (
    <p className="flex flex-wrap items-baseline gap-2">
      <span className="text-xs text-muted">{label}</span>
      {safe ? (
        <a href={href} target="_blank" rel="noreferrer noopener" className="break-all font-mono text-xs hover:text-accent">{href}</a>
      ) : (
        <span className="break-all font-mono text-xs">{href}</span>
      )}
    </p>
  );
}
