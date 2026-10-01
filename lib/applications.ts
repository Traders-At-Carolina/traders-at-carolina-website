import type { Recruiting } from "@/content/types";
import { parseEasternDateTime } from "@/lib/eastern-time";

export type ApplicationState =
  | { status: "open"; deadline?: Date }
  | { status: "closed"; nextOpen?: Date };

/** Single source of truth for every Apply button (spec 05 §3). */
export function getApplicationState(now: Date, recruiting: Recruiting): ApplicationState {
  const nextOpen = recruiting.nextApplicationOpenDate
    ? parseEasternDateTime(recruiting.nextApplicationOpenDate)
    : undefined;
  const closed: ApplicationState = nextOpen ? { status: "closed", nextOpen } : { status: "closed" };

  if (!recruiting.applicationsOpen) return closed;

  if (!recruiting.applyDeadline) return { status: "open" };
  const deadline = parseEasternDateTime(recruiting.applyDeadline);
  return now.getTime() > deadline.getTime() ? closed : { status: "open", deadline };
}
