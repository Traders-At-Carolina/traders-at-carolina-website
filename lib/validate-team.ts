import type { Placement, TeamContent } from "@/content/types";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Fails the build with every content/team.ts and content/placements.ts problem listed at once (spec 04 §5). */
export function validateTeam(team: TeamContent, placements: Placement[]): void {
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

  if (problems.length > 0) {
    throw new Error(`Invalid team content:\n- ${problems.join("\n- ")}`);
  }
}
