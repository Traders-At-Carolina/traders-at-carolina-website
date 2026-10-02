import type { MembershipContent } from "@/content/types";
import { TRACK_ORDER } from "@/lib/membership";

const REQUIRED_WORDING = /\brequire(d|ment|ments)?\b/i;

/**
 * Fails the build with every content/membership.ts problem listed at once.
 * `teamSlugs` are the slugs in content/team.ts; an unknown leadSlug fails so Team links never 404 (spec 03 AC4).
 */
export function validateMembership(membership: MembershipContent, teamSlugs: string[]): void {
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

  if (problems.length > 0) {
    throw new Error(`Invalid content/membership.ts:\n- ${problems.join("\n- ")}`);
  }
}
