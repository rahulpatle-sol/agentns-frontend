import type { NextConfig } from "next";

const PROGRAM_ID = "3CZ5JZgJdxX2wt8UbmyP9kkHPmiMnHhnbsUAXWj7XdnD";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The AgentNS env vars keep their VITE_ names (same as the program repo's app/.env),
  // and are exposed to the browser bundle here. All of them are PUBLIC values.
  env: {
    VITE_SOLANA_CLUSTER: process.env.VITE_SOLANA_CLUSTER || "devnet",
    VITE_SOLANA_RPC_URL: process.env.VITE_SOLANA_RPC_URL || "https://api.devnet.solana.com",
    VITE_SOLANA_WS_URL: process.env.VITE_SOLANA_WS_URL || "",
    VITE_AGENTNS_PROGRAM_ID: process.env.VITE_AGENTNS_PROGRAM_ID || PROGRAM_ID,
  },
};

export default nextConfig;
