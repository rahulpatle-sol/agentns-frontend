import type { AgentRecord } from "@/lib/program/agentns";

export type TrustBadge = "Trusted" | "Verified" | "Staked" | "New" | "Revoked";

/**
 * Display-only badge derived from on-chain fields (the program stores no badge).
 *  Revoked  – name was revoked
 *  Trusted  – endpoint verified AND ≥ 90% challenge pass rate over ≥ 1 challenge
 *  Verified – endpoint verified
 *  Staked   – has SOL locked behind the name
 *  New      – none of the above
 */
export function trustBadge(r: Pick<AgentRecord, "status" | "endpointVerified" | "passes" | "fails" | "stakeLamports">): TrustBadge {
  if (r.status === "revoked") return "Revoked";
  const total = r.passes + r.fails;
  if (r.endpointVerified && total > 0 && r.passes / total >= 0.9) return "Trusted";
  if (r.endpointVerified) return "Verified";
  if (r.stakeLamports > 0n) return "Staked";
  return "New";
}

export function passRate(r: Pick<AgentRecord, "passes" | "fails">): number | null {
  const total = r.passes + r.fails;
  return total === 0 ? null : (r.passes / total) * 100;
}
