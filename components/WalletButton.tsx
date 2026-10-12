"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, ExternalLink, LogOut, Wallet } from "lucide-react";
import {
  useConnect,
  useConnectedWallet,
  useDisconnect,
  useWalletStatus,
  useWallets,
  WalletReadyGate,
} from "@solana/kit-plugin-wallet/react";
import type { Address } from "@solana/kit";
import { useClient } from "@solana/react";

import { explorerAddressUrl } from "@/lib/config";
import { shortenAddress } from "@/lib/format";
import type { AppClient } from "@/lib/state/client";

/** Connect / disconnect control. Hidden behind WalletReadyGate so it never flashes "no wallet". */
export function WalletButton() {
  const client = useClient<AppClient>();
  return (
    <WalletReadyGate client={client} fallback={<span className="h-9 w-32 rounded-lg skeleton" aria-hidden />}>
      <Control />
    </WalletReadyGate>
  );
}

function Control() {
  const client = useClient<AppClient>();
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const status = useWalletStatus(client);
  const { dispatch: connect } = useConnect(client);
  const { dispatch: disconnect } = useDisconnect(client);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const busy = status === "connecting" || status === "reconnecting" || status === "disconnecting";

  if (!connected) {
    if (wallets.length === 0) {
      return (
        <a
          href="https://phantom.com/download"
          target="_blank"
          rel="noreferrer"
          className="btn-primary inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium"
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">Install a wallet</span>
        </a>
      );
    }
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => (wallets.length === 1 ? connect(wallets[0]) : setOpen((o) => !o))}
          disabled={busy}
          aria-haspopup={wallets.length > 1 ? "menu" : undefined}
          aria-expanded={wallets.length > 1 ? open : undefined}
          className="btn-primary inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium disabled:opacity-60"
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">{busy ? "Connecting…" : "Connect wallet"}</span>
        </button>
        {open && wallets.length > 1 && (
          <div role="menu" className="glass absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl p-1.5 shadow-2xl">
            <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-widest text-muted">Choose wallet</p>
            {wallets.map((w) => (
              <button
                key={w.name}
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  connect(w);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-fg/10"
              >
                {(w.icon ?? "").startsWith("data:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.icon} alt="" width={20} height={20} className="rounded" />
                ) : (
                  <Wallet className="h-5 w-5" />
                )}
                {w.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const addr = connected.account.address as Address;
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface/60 px-3 text-sm transition-colors hover:border-line-strong"
      >
        <span className="h-2 w-2 rounded-full bg-ok" />
        <span className="font-mono text-xs">{shortenAddress(addr, 4, 4)}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted" />
      </button>
      {open && (
        <div role="menu" className="glass absolute right-0 top-full z-50 mt-2 w-72 rounded-xl p-2 shadow-2xl">
          <div className="space-y-1 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted">{connected.wallet.name}</p>
            <p className="break-all font-mono text-xs">{addr}</p>
            <Balance client={client} address={addr} />
          </div>
          <div className="my-1 h-px bg-line" />
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(addr);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-fg/10"
          >
            {copied ? <Check className="h-4 w-4 text-ok" /> : <Copy className="h-4 w-4" />} Copy address
          </button>
          <a
            href={explorerAddressUrl(addr)}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-fg/10"
          >
            <ExternalLink className="h-4 w-4" /> View on Explorer
          </a>
          <button
            onClick={() => {
              setOpen(false);
              disconnect();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-bad hover:bg-bad/10"
          >
            <LogOut className="h-4 w-4" /> Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

function Balance({ client, address }: { client: AppClient; address: Address }) {
  const [state, setState] = useState<{ addr: Address; lamports: bigint | null; failed: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    client.rpc
      .getBalance(address)
      .send()
      .then((r) => !cancelled && setState({ addr: address, lamports: r.value, failed: false }))
      .catch(() => !cancelled && setState({ addr: address, lamports: null, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [client, address]);

  const cur = state && state.addr === address ? state : null;
  return (
    <p className="text-sm">
      <span className="text-muted">Balance </span>
      <span className="font-mono tabular-nums">
        {cur?.failed ? "Unavailable" : cur?.lamports == null ? "…" : `${(Number(cur.lamports) / 1e9).toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL`}
      </span>
    </p>
  );
}
