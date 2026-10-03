import type { ClubEvent } from "@/content/types";
import { parseEasternDateTime } from "@/lib/eastern-time";
import { assertNoProblems } from "@/lib/validation";

const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** The instant for a "YYYY-MM-DDTHH:mm" Eastern time, or a problem message. */
function readTime(label: string, value: string, problems: string[]): number | undefined {
  if (!DATE_TIME.test(value)) {
    problems.push(`${label} must be "YYYY-MM-DDTHH:mm" (got "${value}")`);
    return undefined;
  }
  try {
    return parseEasternDateTime(value).getTime();
  } catch (error) {
    problems.push(`${label}: ${(error as Error).message}`);
    return undefined;
  }
}

/** Every content/events.ts problem (spec 09 §5.2, matching spec 06's events rules); empty when valid. */
export function collectEventProblems(events: ClubEvent[]): string[] {
  const problems: string[] = [];
  events.forEach((event, i) => {
    const at = `events[${i}]`;
    if (!event.title.trim()) problems.push(`${at}.title must not be empty`);
    const start = readTime(`${at}.startsAt`, event.startsAt, problems);
    if (event.endsAt !== undefined) {
      const end = readTime(`${at}.endsAt`, event.endsAt, problems);
      if (start !== undefined && end !== undefined && end < start) problems.push(`${at}.endsAt must not be before startsAt`);
    }
    if (event.location !== undefined && !event.location.trim()) problems.push(`${at}.location must not be empty when set`);
    if (event.url !== undefined && !/^https:\/\//.test(event.url)) problems.push(`${at}.url must start with https://`);
    if (event.featured && event.audience !== "public") problems.push(`${at}.featured is only allowed on public events`);
  });
  return problems;
}

/** Fails the build with every content/events.ts problem listed at once. */
export function validateEvents(events: ClubEvent[]): void {
  assertNoProblems("content/events.ts", collectEventProblems(events));
}
