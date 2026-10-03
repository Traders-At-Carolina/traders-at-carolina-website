/** Pure rules for the Admins screen (spec 06 §6.7). Admin access is `publicMetadata.role === "admin"` on a Clerk user. */

export function isAdminUser(publicMetadata: Record<string, unknown> | null | undefined): boolean {
  return publicMetadata?.role === "admin";
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseInviteEmail(raw: unknown): { ok: true; email: string } | { ok: false; error: string } {
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return EMAIL.test(email) ? { ok: true, email } : { ok: false, error: "Enter a valid email address." };
}

/** Why an admin can't be removed, or null when they can. Keeps the site from locking everyone out. */
export function canRemoveAdmin({ targetId, selfId, adminCount }: { targetId: string; selfId: string; adminCount: number }): string | null {
  if (targetId === selfId) return "You can't remove yourself.";
  if (adminCount <= 1) return "The site needs at least one admin.";
  return null;
}
