import type { TeamContent } from "@/content/types";

/**
 * Exec board and track leads (docs/specs/04-team.md). Officers edit this file each year.
 *
 * Add a person:
 *   import janeDoe from "@/public/images/team/jane-doe.jpg";
 *   {
 *     slug: "jane-doe", name: "Jane Doe", role: "President", group: "exec", order: 1,
 *     classYear: 2027, major: "Mathematics", headshot: janeDoe, alt: "Portrait of Jane Doe",
 *     linkedin: "https://www.linkedin.com/in/…",
 *   }
 * - Track leads: group "track-lead" plus track ("trading" | "research" | "development").
 * - An exec who also leads a track: keep group "exec" and add track; they appear once, under the board.
 * - placement: only with the person's consent.
 */
export const team: TeamContent = {
  people: [],
};
