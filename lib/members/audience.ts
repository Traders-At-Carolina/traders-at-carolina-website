import type { Audience } from "@/content/types";

/** The portal viewer as audiences see it (spec 06 §8). Admins count as members. */
export type AudienceViewer = "signed_in" | "member";

export const audienceViewer = (isMember: boolean): AudienceViewer => (isMember ? "member" : "signed_in");

/**
 * Whether the viewer may see an item (spec 06 §8). Every portal query filters with this on the server, so nothing
 * members-only ever reaches a non-member's browser. Everyone in the portal is signed in, so only `members` gates.
 */
export function canSee(audience: Audience, viewer: AudienceViewer): boolean {
  return audience !== "members" || viewer === "member";
}
