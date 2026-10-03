"use server";

import { currentUser } from "@clerk/nextjs/server";
import { requireViewer } from "@/lib/auth/viewer";
import { portalSettings } from "@/lib/data/portal";
import { db } from "@/lib/db/client";
import { membershipRequests } from "@/lib/db/schema";

export type RequestResult = { ok: true } | { ok: false; reason: "already-member" | "requests-closed" | "already-pending" };

/**
 * "Request access" from the portal (spec 06 §8, §9): creates the viewer's pending request, one per user. Refused when
 * requests are off, the viewer is already a member, or they already have a pending request (phase 4's unique index).
 * Re-checks the session, like every server action.
 *
 * The request records the viewer's primary email and name, so admins can see who is asking.
 */
export async function requestMembership({ note }: { note?: string }): Promise<RequestResult> {
  const viewer = await requireViewer();
  if (viewer.isMember) return { ok: false, reason: "already-member" };
  const { acceptRequests } = await portalSettings();
  if (!acceptRequests) return { ok: false, reason: "requests-closed" };
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "";
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || email.split("@")[0];
  const trimmed = note?.trim().slice(0, 500) || null;
  try {
    await db().insert(membershipRequests).values({ userId: viewer.userId, email, name, note: trimmed, status: "pending" });
  } catch (error) {
    // The partial unique index allows one pending request per user.
    if (/membership_requests_one_pending_idx|duplicate key/i.test(String((error as { message?: string }).message ?? error))) {
      return { ok: false, reason: "already-pending" };
    }
    throw error;
  }
  return { ok: true };
}
