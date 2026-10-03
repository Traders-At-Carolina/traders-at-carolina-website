import { clerkClient } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin/admins";

export type AdminUser = { id: string; name: string; email: string | undefined };
export type AdminInvite = { id: string; email: string; createdAt: number };

/**
 * Clerk users with `role: "admin"`. Sign-up is public (game players have accounts too, spec 03 §3.7), so admins are
 * filtered from the full list; a club-sized user base fits in a few pages.
 */
export async function listAdmins(): Promise<AdminUser[]> {
  const client = await clerkClient();
  const admins: AdminUser[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, totalCount } = await client.users.getUserList({ limit: 500, offset });
    for (const u of data) {
      if (!isAdminUser(u.publicMetadata)) continue;
      const email = u.primaryEmailAddress?.emailAddress;
      admins.push({ id: u.id, name: u.fullName || email || u.id, email });
    }
    if (offset + data.length >= totalCount || data.length === 0) break;
  }
  return admins;
}

/** Pending invitations that will make their recipient an admin on sign-up. */
export async function listPendingAdminInvites(): Promise<AdminInvite[]> {
  const client = await clerkClient();
  const { data } = await client.invitations.getInvitationList({ status: "pending", limit: 100 });
  return data
    .filter((i) => isAdminUser(i.publicMetadata as Record<string, unknown> | null))
    .map((i) => ({ id: i.id, email: i.emailAddress, createdAt: i.createdAt }));
}

export type Account = { id: string; name: string; email: string | undefined; createdAt: number; lastSignInAt: number | null; isAdmin: boolean };

/** Every Clerk user (game players included) for Members → All accounts (spec 06 §6.2). */
export async function listAccounts(): Promise<Account[]> {
  const client = await clerkClient();
  const accounts: Account[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, totalCount } = await client.users.getUserList({ limit: 500, offset, orderBy: "-created_at" });
    for (const u of data) {
      const email = u.primaryEmailAddress?.emailAddress;
      accounts.push({ id: u.id, name: u.fullName || email || u.id, email, createdAt: u.createdAt, lastSignInAt: u.lastSignInAt, isAdmin: isAdminUser(u.publicMetadata) });
    }
    if (offset + data.length >= totalCount || data.length === 0) break;
  }
  return accounts;
}

/** Lowercased emails that already have a Clerk account, so bulk invitations can skip them. */
export async function emailsWithAccounts(emails: string[]): Promise<Set<string>> {
  const client = await clerkClient();
  const found = new Set<string>();
  for (let i = 0; i < emails.length; i += 100) {
    const { data } = await client.users.getUserList({ emailAddress: emails.slice(i, i + 100), limit: 100 });
    for (const u of data) for (const e of u.emailAddresses) found.add(e.emailAddress.toLowerCase());
  }
  return found;
}
