/**
 * Plugin and API extension declarations (no runtime).
 *
 * Requirements:
 * - `CommercePlugin`: name, version, configure(ctx), optional API extensions.
 * - Plugins must not bypass ports for persistence (R-DOM-1).
 *
 * TODO:
 * - [ ] Define `CommercePlugin`, `ApiExtensionContribution`, bootstrap context type.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Kernel
 */
export type CommercePlugin = {
  readonly name: string;
  readonly version: string;
  // TODO: configure, extensions, registerServices, registerWorkflows
};

