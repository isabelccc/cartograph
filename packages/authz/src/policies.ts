/**
 * Action constants for coarse RBAC (extend with CASL / OPA later).
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — authz
 */
export const Actions = {
  ADMIN_READ: "admin.read",
  ADMIN_WRITE: "admin.write",
  SHOP_WRITE: "shop.write",
  PUBLIC_READ: "public.read",
} as const;

export type Action = (typeof Actions)[keyof typeof Actions];

export type ActorKind = "admin" | "shop" | "anonymous";

/** Which actions each actor may perform. */
const matrix: Record<ActorKind, ReadonlySet<Action>> = {
  admin: new Set([
    Actions.ADMIN_READ,
    Actions.ADMIN_WRITE,
    Actions.SHOP_WRITE,
    Actions.PUBLIC_READ,
  ]),
  shop: new Set([Actions.SHOP_WRITE, Actions.PUBLIC_READ]),
  anonymous: new Set([Actions.PUBLIC_READ]),
};

export function loadPolicies(): Readonly<Record<ActorKind, ReadonlySet<Action>>> {
  return matrix;
}
