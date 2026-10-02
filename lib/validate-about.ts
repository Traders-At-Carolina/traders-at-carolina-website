import type { AboutContent, TimelineEntry } from "@/content/types";
import { assertNoProblems } from "@/lib/validation";

/** Every content/about.ts and content/timeline.ts problem; empty when valid. Admin saves show these as form errors (spec 06 §5). */
export function collectAboutProblems(about: AboutContent, timeline: TimelineEntry[]): string[] {
  const problems: string[] = [];

  const principles = about.principles.length;
  if (principles < 3 || principles > 4) problems.push(`principles must have 3–4 entries (got ${principles})`);

  const paragraphs = about.story.paragraphs.length;
  if (paragraphs === 1 || paragraphs > 4) problems.push(`story.paragraphs must have 0 or 2–4 entries (got ${paragraphs})`);
  if (about.story.quote && paragraphs === 0) problems.push("story.quote needs story paragraphs to sit beside");

  const seen = new Set<string>();
  for (const partner of about.partners) {
    const key = partner.name.trim().toLowerCase();
    if (seen.has(key)) problems.push(`partners: duplicate name "${partner.name}"`);
    seen.add(key);
  }
  for (const partner of about.partners) {
    if (partner.url !== undefined && !partner.url.startsWith("https://")) {
      problems.push(`partners: url for "${partner.name}" must be https (got "${partner.url}")`);
    }
  }

  timeline.forEach((entry, i) => {
    if (!Number.isInteger(entry.year) || entry.year < 1900 || entry.year > 2100) {
      problems.push(`timeline[${i}].year must be a four-digit year (got ${entry.year})`);
    }
    if (!entry.title.trim()) problems.push(`timeline[${i}].title must not be empty`);
  });

  return problems;
}

/** Fails the build with every content/about.ts and content/timeline.ts problem listed at once. */
export function validateAbout(about: AboutContent, timeline: TimelineEntry[]): void {
  assertNoProblems("About content", collectAboutProblems(about, timeline));
}
