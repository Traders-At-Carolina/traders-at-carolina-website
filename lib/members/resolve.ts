import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import type { TrackId } from "@/content/types";
import { db } from "@/lib/db/client";
import { members } from "@/lib/db/schema";
import { membershipFromRow } from "@/lib/members/roster";
import { portalAccessSettings } from "@/lib/members/settings";

/** A roster member's standing (spec 06 §8). Admins are treated as members by the caller, never here. */
export type Membership = { status: "active" | "alumni"; track?: TrackId } | null;

/**
 * The signed-in user's roster membership (spec 06 §8, §9): the row with their user id, else the row matching any
 * verified email (case-insensitive), which then gets their user id. Null for no row, an inactive row, or an alumni
 * row while alumni access is off. Runs per request on portal pages only; the portal never reads Clerk metadata.
 */
export async function getMembership(user: { id: string; verifiedEmails: string[] }): Promise<Membership> {
  const settings = await portalAccessSettings();
  const [linked] = await db().select().from(members).where(eq(members.userId, user.id)).limit(1);
  if (linked) return membershipFromRow(linked, settings);

  const emails = user.verifiedEmails.map((e) => e.toLowerCase());
  if (emails.length === 0) return null;
  const [byEmail] = await db()
    .select()
    .from(members)
    .where(inArray(sql`lower(${members.email})`, emails))
    .limit(1);
  if (!byEmail) return null;
  // Link on first match so later lookups use the id, even if they change their email. Only an unlinked row is linked.
  if (!byEmail.userId) {
    await db().update(members).set({ userId: user.id, updatedAt: new Date() }).where(and(eq(members.id, byEmail.id), isNull(members.userId)));
  }
  return byEmail.userId && byEmail.userId !== user.id ? null : membershipFromRow(byEmail, settings);
}
