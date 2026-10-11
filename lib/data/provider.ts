import type {
  Agent,
  AgentEvent,
  Filters,
  Listing,
  SearchSuggestions,
  Stats,
} from './types';
import {
  mockAgents,
  mockEvents,
  mockListings,
  mockStats,
} from './mockAgents';

// Mock API delay
const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export async function listAgents(filters: Filters = {}): Promise<Agent[]> {
  await mockDelay();
  let results = [...mockAgents];
  
  // Apply filters
  if (filters.capability) {
    results = results.filter(a => a.capability === filters.capability);
  }
  if (filters.protocol) {
    results = results.filter(a => a.protocol === filters.protocol);
  }
  if (filters.badge) {
    results = results.filter(a => a.badge === filters.badge);
  }
  const minimumStake = filters.minStake;
  if (minimumStake !== undefined) {
    results = results.filter(a => a.stakeLamports / 1_000_000_000 >= minimumStake);
  }
  if (!filters.showUnverified) {
    results = results.filter(a => a.status !== 'revoked' && a.endpointVerified);
  }
  
  return results;
}

export async function getAgent(name: string): Promise<Agent | null> {
  await mockDelay();
  const agent = mockAgents.find(a => a.name === name);
  return agent || null;
}

export async function getAgentEvents(name: string): Promise<AgentEvent[]> {
  await mockDelay();
  // Return events related to this agent
  return mockEvents.filter(e => e.agentName === name);
}

export async function getWalletAgents(address: string): Promise<Agent[]> {
  await mockDelay();
  return mockAgents.filter(a => a.owner === address || a.agentPubkey === address);
}

export async function getStats(): Promise<Stats> {
  await mockDelay();
  return mockStats;
}

export async function listListings(filters: Filters = {}): Promise<Listing[]> {
  await mockDelay();
  let results = [...mockListings];
  
  if (filters.capability) {
    results = results.filter(l => {
      const agent = mockAgents.find(a => a.name === l.name);
      return agent?.capability === filters.capability;
    });
  }
  
  return results;
}

export async function searchSuggestions(query: string): Promise<SearchSuggestions> {
  await mockDelay();
  
  // Filter suggestions based on query
  const allSuggestions = [
    'mcp://sentiment.text-analysis.acme.v1.0',
    'mcp://translation.english-solver.acme.v1.2',
    'mcp://code-review.backend.acme.v1.0',
    'mcp://web-search.lucide.v1.0',
    'mcp://trading-signals.alchemy.v1.0',
    'mcp://image-captioning.stability.v1.0',
    'mcp://data-extraction.parsel.v1.0',
    'mcp://summarization.cohere.v1.2',
  ];
  
  const filtered = allSuggestions.filter(s =>
    s.toLowerCase().includes(query.toLowerCase())
  );
  
  return { suggestions: filtered.length > 0 ? filtered : allSuggestions.slice(0, 5) };
}
