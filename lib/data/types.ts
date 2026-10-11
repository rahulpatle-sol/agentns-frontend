export type AgentStatus = 'active' | 'revoked';
export type AgentBadge = 'Trusted' | 'Verified' | 'Staked' | 'New';

export interface Health {
  online: boolean;
  responseMs: number;
  lastChecked: number;
  uptime24h: number;
  uptime7d: number;
}

export interface Agent {
  name: string;
  nameHash: string;
  protocol: string;
  agentId: string;
  capability: string;
  provider: string;
  version: string;
  owner: string;
  agentPubkey: string;
  accountAddress: string;
  endpoint: string;
  metadataUri?: string | null;
  status: AgentStatus;
  stakeLamports: number;
  passes: number;
  fails: number;
  unstakeRequestedAt: number; // 0 = none
  endpointVerified: boolean;
  registeredAt: number;
  updatedAt: number;
  badge: AgentBadge;
  health: Health;
  listing?: Listing;
}

export interface Listing {
  name: string;
  priceSOL: number;
  trustBadge: AgentBadge;
  stakeSOL: number;
  passRate: number;
  seller: string;
  listedAt: number;
}

export interface AgentEvent {
  id: string;
  type: string;
  agentName: string;
  actor: string;
  amountLamports?: number;
  txSignature: string;
  timestamp: number;
  details?: string;
}

export interface Stats {
  totalAgents: number;
  totalStakedSOL: number;
  verifiedAgents: number;
  checks24h: number;
}

export interface Filters {
  capability?: string;
  protocol?: string;
  badge?: AgentBadge;
  minStake?: number;
  showUnverified?: boolean;
}

export interface SearchSuggestions {
  suggestions: string[];
}
