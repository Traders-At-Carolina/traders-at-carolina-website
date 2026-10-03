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
