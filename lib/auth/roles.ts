/**
 * True when Clerk session claims carry `metadata.role === "admin"`. The claim comes from the session token
 * customization `{"metadata":"{{user.public_metadata}}"}`; invitations set `publicMetadata.role` (spec 06 §4).
 */
export function isAdminClaims(claims: unknown): boolean {
  if (!claims || typeof claims !== "object") return false;
  const metadata = (claims as { metadata?: unknown }).metadata;
  if (!metadata || typeof metadata !== "object") return false;
  return (metadata as { role?: unknown }).role === "admin";
}
