/**
 * Runtime configuration. Every value is PUBLIC — it is inlined into the browser
 * bundle through `env` in next.config.ts. Never add a secret here.
 *
 * Variable names keep the VITE_ prefix so the same .env works with the
 * program repo's Vite app.
 */

export type ClusterId = "localnet" | "devnet" | "mainnet-beta";

type ClusterConfig = {
  readonly chain: "solana:localnet" | "solana:devnet" | "solana:mainnet";
  readonly label: string;
  readonly defaultRpcUrl: string;
  readonly defaultWsUrl: string;
  readonly explorerUrl: string;
  readonly isTestnet: boolean;
};

const CLUSTERS: Record<ClusterId, ClusterConfig> = {
  localnet: {
    chain: "solana:localnet",
    label: "Localnet",
    defaultRpcUrl: "http://127.0.0.1:8899",
    defaultWsUrl: "ws://127.0.0.1:8900",
    explorerUrl: "https://explorer.solana.com",
    isTestnet: true,
  },
  devnet: {
    chain: "solana:devnet",
    label: "Devnet",
    defaultRpcUrl: "https://api.devnet.solana.com",
    defaultWsUrl: "wss://api.devnet.solana.com",
    explorerUrl: "https://explorer.solana.com",
    isTestnet: true,
  },
  "mainnet-beta": {
    chain: "solana:mainnet",
    label: "Mainnet",
    defaultRpcUrl: "https://api.mainnet-beta.solana.com",
    defaultWsUrl: "wss://api.mainnet-beta.solana.com",
    explorerUrl: "https://explorer.solana.com",
    isTestnet: false,
  },
};

const rawCluster = process.env.VITE_SOLANA_CLUSTER;
const clusterId: ClusterId =
  rawCluster === "localnet" || rawCluster === "mainnet-beta" ? rawCluster : "devnet";
const cluster = CLUSTERS[clusterId];

const rpcUrl = process.env.VITE_SOLANA_RPC_URL?.trim() || cluster.defaultRpcUrl;
const wsFromRpc = rpcUrl.replace(/^http/, "ws");

export const activeCluster = {
  id: clusterId,
  ...cluster,
  rpcUrl,
  wsUrl: process.env.VITE_SOLANA_WS_URL?.trim() || (process.env.VITE_SOLANA_RPC_URL ? wsFromRpc : cluster.defaultWsUrl),
} as const;

export const agentnsProgramId =
  process.env.VITE_AGENTNS_PROGRAM_ID?.trim() || "3CZ5JZgJdxX2wt8UbmyP9kkHPmiMnHhnbsUAXWj7XdnD";

/** Explorer links carry ?cluster= so devnet transactions open on devnet. */
const clusterQuery = clusterId === "mainnet-beta" ? "" : `?cluster=${clusterId === "localnet" ? "custom&customUrl=" + encodeURIComponent(rpcUrl) : clusterId}`;

export const explorerTxUrl = (sig: string) => `${activeCluster.explorerUrl}/tx/${sig}${clusterQuery}`;
export const explorerAddressUrl = (addr: string) => `${activeCluster.explorerUrl}/address/${addr}${clusterQuery}`;
