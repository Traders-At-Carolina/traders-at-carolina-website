"use server";

import { requireViewer } from "@/lib/auth/viewer";
import { portalSettings } from "@/lib/data/portal";

export type RequestResult = { ok: true } | { ok: false; reason: "already-member" | "requests-closed" | "already-pending" };

/**
 * "Request access" from the portal (spec 06 §8, §9): creates the viewer's pending request, one per user. Refused when
 * requests are off, the viewer is already a member, or they already have a pending request (phase 4's unique index).
 * Re-checks the session, like every server action.
 *
 * Until spec 06 phase 4 adds `membership_requests`, requests are off (lib/data/portal.ts), so this always refuses.
 * Phase 4 inserts the request where marked.
 */
export async function requestMembership({ note }: { note?: string }): Promise<RequestResult> {
  const viewer = await requireViewer();
  if (viewer.isMember) return { ok: false, reason: "already-member" };
  const { acceptRequests } = await portalSettings();
  if (!acceptRequests) return { ok: false, reason: "requests-closed" };
  void note?.trim().slice(0, 500);
  // Spec 06 phase 4: insert { user_id: viewer.userId, note, status: "pending" } here and return { ok: true }.
  return { ok: false, reason: "requests-closed" };
}
