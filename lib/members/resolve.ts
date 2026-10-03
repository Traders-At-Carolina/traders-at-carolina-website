import type { TrackId } from "@/content/types";

/** A roster member's standing (spec 06 §8). Admins are treated as members by the caller, never here. */
export type Membership = { status: "active" | "alumni"; track?: TrackId } | null;

/**
 * The signed-in user's roster membership (spec 06 §8, §9): the row with their user id, else the row matching any
 * verified email (case-insensitive), which then gets their user id. Null for no row, an inactive row, or an alumni
 * row while alumni access is off.
 *
 * STUB until spec 06 phase 4 adds the `members` table: nobody is on the roster yet, so this returns null and only
 * admins see the member view. Phase 4 replaces the body; the signature is fixed. The portal never reads membership
 * from Clerk metadata, not even as a stand-in.
 */
export async function getMembership(user: { id: string; verifiedEmails: string[] }): Promise<Membership> {
  void user;
  return null;
}
