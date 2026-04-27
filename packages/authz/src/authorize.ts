/**
 * authorize(actorKind, action) — coarse RBAC gate.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — authz
 */
import { loadPolicies, type Action, type ActorKind } from "./policies.js";

export function authorize(actor: ActorKind, action: Action): boolean {
  const policies = loadPolicies();
  return policies[actor]?.has(action) ?? false;
}
