import type { Placement, TeamContent } from "@/content/types";
import { assertNoProblems } from "@/lib/validation";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Every content/team.ts and content/placements.ts problem (spec 04 §5); empty when valid. Admin saves show these as form errors (spec 06 §5). */
export function collectTeamProblems(team: TeamContent, placements: Placement[]): string[] {
  const problems: string[] = [];
  const slugs = new Set<string>();

  for (const person of team.people) {
    const who = `people "${person.slug}"`;
    if (!KEBAB.test(person.slug)) problems.push(`${who}: slug must be kebab-case`);
    if (slugs.has(person.slug)) problems.push(`${who}: duplicate slug`);
    slugs.add(person.slug);
    if (person.group === "track-lead" && !person.track) problems.push(`${who}: track leads need a track`);
    if (person.headshot && !person.alt?.trim()) problems.push(`${who}: headshot needs non-empty alt text`);
    if (person.linkedin !== undefined && !person.linkedin.startsWith("https://")) {
      problems.push(`${who}: linkedin must be an https URL`);
    }
  }

  const firms = new Set<string>();
  for (const { firm } of placements) {
    const key = firm.trim().toLowerCase();
    if (firms.has(key)) problems.push(`placements: duplicate firm "${firm}"`);
    firms.add(key);
  }

  return problems;
}

/** Fails the build with every content/team.ts and content/placements.ts problem listed at once (spec 04 §5). */
export function validateTeam(team: TeamContent, placements: Placement[]): void {
  assertNoProblems("team content", collectTeamProblems(team, placements));

  const soft = lowResHeadshots(team);
  if (soft.length > 0) {
    console.warn(`Team headshots below ${MIN_HEADSHOT_WIDTH}px wide will look soft on high-density screens: ${soft.join(", ")}`);
  }
}

/** Cards render up to 256px wide, so 2x screens need about 512px; 600px leaves room for cropping. */
export const MIN_HEADSHOT_WIDTH = 600;

/** Slugs whose headshot is narrower than MIN_HEADSHOT_WIDTH. A warning, not a build failure, until better photos arrive. */
export function lowResHeadshots(team: TeamContent): string[] {
  return team.people.filter((p) => p.headshot && p.headshot.width < MIN_HEADSHOT_WIDTH).map((p) => p.slug);
}
