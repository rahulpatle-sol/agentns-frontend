"use client";

import type { ReactNode } from "react";
import { createClient } from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { walletSigner } from "@solana/kit-plugin-wallet";
import { ClientProvider } from "@solana/react";

import { activeCluster } from "@/lib/config";

/**
 * One client for the whole app. The connected wallet supplies the payer and the
 * identity; `solanaRpc` adds the connection, subscriptions and the transaction
 * planner/executor behind `client.sendTransaction`.
 * `walletSigner` must come before `solanaRpc` (the RPC plugin needs a payer).
 */
const client = createClient()
  .use(walletSigner({ chain: activeCluster.chain }))
  .use(
    solanaRpc({
      rpcUrl: activeCluster.rpcUrl,
      rpcSubscriptionsUrl: activeCluster.wsUrl,
    }),
  );

export type AppClient = Awaited<typeof client>;

export function Providers({ children }: { children: ReactNode }) {
  return <ClientProvider client={client}>{children}</ClientProvider>;
}
