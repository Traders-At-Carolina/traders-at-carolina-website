/**
 * Portal access settings (spec 06 §5.2 `portal`). Until phase 6 adds the `settings` table and phase 7 the Portal
 * settings screen, the spec's defaults apply: alumni keep access, and requests are accepted.
 */
export const PORTAL_ACCESS_DEFAULTS = { alumniAccess: true, acceptRequests: true } as const;

export async function portalAccessSettings(): Promise<{ alumniAccess: boolean; acceptRequests: boolean }> {
  return PORTAL_ACCESS_DEFAULTS;
}
