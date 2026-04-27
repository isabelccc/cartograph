/**
 * REST route manifest merge point.
 *
 * Collected structure for future kernel-driven route registration.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — api-rest
 */
export type RouteManifest = {
  readonly id: string;
  readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly path: string;
};

export function buildRoutesManifest(): readonly RouteManifest[] {
  return [];
}
