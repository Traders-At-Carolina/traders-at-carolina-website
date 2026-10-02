import type { MembershipContent } from "@/content/types";
import { TRACK_ORDER } from "@/lib/membership";
import { assertNoProblems } from "@/lib/validation";

const REQUIRED_WORDING = /\brequire(d|ment|ments)?\b/i;

/**
 * Every content/membership.ts problem; empty when valid. Admin saves show these as form errors (spec 06 §5).
 * `teamSlugs` are the slugs in content/team.ts; an unknown leadSlug is a problem so Team links never 404 (spec 03 AC4).
 */
export function collectMembershipProblems(membership: MembershipContent, teamSlugs: string[]): string[] {
  const problems: string[] = [];

  if (membership.steps.length !== 3) problems.push(`steps must have exactly 3 entries (got ${membership.steps.length})`);

  const ids = membership.tracks.map((t) => t.id);
  if (ids.join(",") !== TRACK_ORDER.join(",")) {
    problems.push(`tracks must be exactly ${TRACK_ORDER.join(", ")} in that order (got ${ids.join(", ") || "none"})`);
  }

  for (const track of membership.tracks) {
    const count = track.recommendedBackground.length;
    if (count < 2 || count > 4) problems.push(`tracks.${track.id}.recommendedBackground must have 2–4 items (got ${count})`);
    // Background is recommended, never required (spec 03 §3.3, AC3).
    const text = [track.description, track.goodFit ?? "", track.sampleProblem ?? "", ...track.recommendedBackground].join(" ");
    if (REQUIRED_WORDING.test(text)) problems.push(`tracks.${track.id} must not say "required" or "requirements"`);
    if (track.leadSlug && !teamSlugs.includes(track.leadSlug)) {
      problems.push(`tracks.${track.id}.leadSlug "${track.leadSlug}" is not a person in content/team.ts`);
    }
  }

  if (membership.activities.length === 0) problems.push("activities must not be empty");
  membership.activities.forEach((activity, i) => {
    if (activity.tracks !== "all" && activity.tracks.some((id) => !TRACK_ORDER.includes(id))) {
      problems.push(`activities[${i}].tracks contains an unknown track id`);
    }
  });

  return problems;
}

/** Fails the build with every content/membership.ts problem listed at once. */
export function validateMembership(membership: MembershipContent, teamSlugs: string[]): void {
  assertNoProblems("content/membership.ts", collectMembershipProblems(membership, teamSlugs));
}
