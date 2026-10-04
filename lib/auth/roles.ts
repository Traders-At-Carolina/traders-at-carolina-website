import { isAdminUser } from "@/lib/admin/admins";

type AccountLike = {
  publicMetadata?: Record<string, unknown> | null;
  emailAddresses: { emailAddress: string; verification?: { status?: string | null } | null }[];
};

/** Lowercased emails from the comma-separated ADMIN_EMAILS env var. */
export function adminEmails(raw: string | undefined = process.env.ADMIN_EMAILS): string[] {
  return (raw ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

/**
 * Admin = a Clerk user with `publicMetadata.role === "admin"` (what the Admins screen grants) or a verified email listed
 * in ADMIN_EMAILS (how the first admin gets in). Read from the live user, so no session token setup is needed.
 */
export function isAdminAccount(user: AccountLike, allowlist: string[] = adminEmails()): boolean {
  if (isAdminUser(user.publicMetadata)) return true;
  return user.emailAddresses.some((e) => e.verification?.status === "verified" && allowlist.includes(e.emailAddress.toLowerCase()));
}
