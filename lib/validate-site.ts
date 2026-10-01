import type { Site } from "@/content/types";
import { parseEasternDateTime } from "@/lib/eastern-time";

const GOOGLE_FORM = /^https:\/\/(docs\.google\.com\/forms\/|forms\.gle\/)/;

/** Fails the build with every content problem listed at once. */
export function validateSite(site: Site): void {
  const problems: string[] = [];
  const r = site.recruiting;

  if (r.applicationsOpen && !GOOGLE_FORM.test(r.applyUrl)) {
    problems.push(`recruiting.applyUrl must be an https Google Forms URL when applications are open (got "${r.applyUrl}")`);
  }
  if (r.interestFormUrl !== undefined && !GOOGLE_FORM.test(r.interestFormUrl)) {
    problems.push(`recruiting.interestFormUrl must be an https Google Forms URL (got "${r.interestFormUrl}")`);
  }

  const dates: Array<[string, string | undefined]> = [
    ["applyDeadline", r.applyDeadline],
    ["decisionDate", r.decisionDate],
    ["nextApplicationOpenDate", r.nextApplicationOpenDate],
  ];
  for (const [field, value] of dates) {
    if (value === undefined) continue;
    try {
      parseEasternDateTime(value);
    } catch (error) {
      problems.push(`recruiting.${field}: ${(error as Error).message}`);
    }
  }

  if (r.interviewWindow) {
    try {
      const start = parseEasternDateTime(r.interviewWindow.start);
      const end = parseEasternDateTime(r.interviewWindow.end);
      if (end < start) problems.push("recruiting.interviewWindow.end is before start");
    } catch (error) {
      problems.push(`recruiting.interviewWindow: ${(error as Error).message}`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`Invalid content/site.ts:\n- ${problems.join("\n- ")}`);
  }
}
