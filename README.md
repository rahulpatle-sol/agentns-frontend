# AgentNS Frontend

Explorer + registry UI for the [AgentNS](https://github.com/rahulpatle-sol/agentns) Solana program (AI-agent name registry).
Next.js 16 · React 19 · Tailwind v4 · `@solana/kit` + Wallet Standard.

## Run

```bash
npm install
cp .env.example .env.local   # already set to devnet + program id
npm run dev                  # http://localhost:3000
```

## Environment (all PUBLIC values)

| Variable | Default | Notes |
| --- | --- | --- |
| `VITE_SOLANA_CLUSTER` | `devnet` | `localnet` \| `devnet` \| `mainnet-beta` |
| `VITE_SOLANA_RPC_URL` | `https://api.devnet.solana.com` | Use a dedicated RPC (Helius/QuickNode) — public devnet is rate-limited |
| `VITE_SOLANA_WS_URL` | derived from RPC | optional |
| `VITE_AGENTNS_PROGRAM_ID` | `3CZ5JZgJdxX2wt8UbmyP9kkHPmiMnHhnbsUAXWj7XdnD` | `declare_id!` of the program |

The `VITE_` prefix is kept so the same `.env` works with the program repo's Vite app; `next.config.ts` exposes them to the browser.
Never put a private key in these variables.

## Pages

- `/` – Explorer: live agents read from the program (`getProgramAccounts`), search, filters, stats
- `/register` – register a name (live name hash + PDA preview, cost breakdown, on-chain validation mirrors)
- `/names` – names owned by the connected wallet
- `/names/[pda]` – record details; owner can update endpoint, transfer, revoke
- `/activity` – latest program transactions

Wallet connect uses Wallet Standard (Phantom, Solflare, Backpack, …) — set the wallet to the same cluster as `VITE_SOLANA_CLUSTER`.

## Layout

```
app/            routes
components/     UI (WalletButton, DataTable, StatCard, Toast, …)
lib/program/    hand-written client for the Anchor program (borsh, PDAs, instruction builders)
lib/state/      SWR read hooks, transaction hook, wallet hook
lib/config.ts   cluster / RPC / program-id config
```

Implemented instructions: `register_name`, `update_endpoint`, `transfer_name`, `revoke_name`.
Marketplace (`list_name`, `buy_name`, `cancel_listing`) and stake management are not wired into the UI yet.
