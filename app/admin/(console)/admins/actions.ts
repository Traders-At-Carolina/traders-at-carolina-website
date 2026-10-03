"use server";

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { canRemoveAdmin, isAdminUser, parseInviteEmail } from "@/lib/admin/admins";
import { recordAudit } from "@/lib/admin/audit";
import { listAdmins } from "@/lib/admin/clerk-admins";
import { AdminAccessError, requireAdmin } from "@/lib/auth/admin";

export type ActionState = { ok?: string; error?: string };

/** Signed-in admin plus their email, for the change log. */
async function actor() {
  const { userId } = await requireAdmin();
  const me = await currentUser();
  return { actorId: userId, actorEmail: me?.primaryEmailAddress?.emailAddress ?? null };
}

function clerkMessage(error: unknown): string {
  if (error instanceof AdminAccessError) return "Only admins can do that.";
  const first = (error as { errors?: Array<{ longMessage?: string; message?: string }> }).errors?.[0];
  return first?.longMessage ?? first?.message ?? "Something went wrong. Try again.";
}

/** Absolute origin for the invitation link, from the request (works on localhost, previews and production). */
async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Makes someone an admin (spec 06 §6.7). An existing account (e.g. a game player) gets the role straight away;
 * anyone else gets an invitation that sets the role when they sign up.
 */
export async function inviteAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const who = await actor();
    const parsed = parseInviteEmail(formData.get("email"));
    if (!parsed.ok) return { error: parsed.error };
    const client = await clerkClient();

    const { data } = await client.users.getUserList({ emailAddress: [parsed.email], limit: 1 });
    const existing = data[0];
    if (existing) {
      if (isAdminUser(existing.publicMetadata)) return { error: `${parsed.email} is already an admin.` };
      await client.users.updateUserMetadata(existing.id, { publicMetadata: { role: "admin" } });
      await recordAudit({ ...who, action: "grant-admin", entity: "admin", entityLabel: parsed.email });
      revalidatePath("/admin/admins");
      return { ok: `${parsed.email} is now an admin. It takes effect the next time they load a page (within a minute).` };
    }

    await client.invitations.createInvitation({
      emailAddress: parsed.email,
      redirectUrl: `${await origin()}/admin/sign-up`,
      publicMetadata: { role: "admin" },
    });
    await recordAudit({ ...who, action: "invite", entity: "admin", entityLabel: parsed.email });
    revalidatePath("/admin/admins");
    return { ok: `Invitation sent to ${parsed.email}.` };
  } catch (error) {
    return { error: clerkMessage(error) };
  }
}

/** Takes away admin access but keeps the account (it may hold game scores). Never yourself, never the last admin. */
export async function removeAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const who = await actor();
    const targetId = String(formData.get("userId") ?? "");
    const admins = await listAdmins();
    const target = admins.find((a) => a.id === targetId);
    if (!target) return { error: "That person isn't an admin." };
    const reason = canRemoveAdmin({ targetId, selfId: who.actorId, adminCount: admins.length });
    if (reason) return { error: reason };
    const client = await clerkClient();
    await client.users.updateUserMetadata(targetId, { publicMetadata: { role: null } });
    await recordAudit({ ...who, action: "revoke-admin", entity: "admin", entityLabel: target.email ?? target.name });
    revalidatePath("/admin/admins");
    return { ok: `${target.name} is no longer an admin.` };
  } catch (error) {
    return { error: clerkMessage(error) };
  }
}

export async function revokeInvite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const who = await actor();
    const invitationId = String(formData.get("invitationId") ?? "");
    const email = String(formData.get("email") ?? "");
    const client = await clerkClient();
    await client.invitations.revokeInvitation(invitationId);
    await recordAudit({ ...who, action: "revoke-invite", entity: "admin", entityLabel: email });
    revalidatePath("/admin/admins");
    return { ok: `Invitation to ${email} revoked.` };
  } catch (error) {
    return { error: clerkMessage(error) };
  }
}
