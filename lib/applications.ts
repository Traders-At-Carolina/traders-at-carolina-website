import type { Recruiting } from "@/content/types";
import { parseEasternDateTime } from "@/lib/eastern-time";

export type ApplicationState =
  | { status: "open"; deadline?: Date }
  | { status: "closed"; nextOpen?: Date };

/**
 * Single source of truth for every Apply button (spec 05 §3). `mode` (spec 06 §5.2) takes precedence over
 * `applicationsOpen`: "scheduled" is closed until the next-open moment, then open, still closing at the deadline.
 */
export function getApplicationState(now: Date, recruiting: Recruiting): ApplicationState {
  const nextOpen = recruiting.nextApplicationOpenDate
    ? parseEasternDateTime(recruiting.nextApplicationOpenDate)
    : undefined;
  const upcoming = nextOpen && nextOpen.getTime() > now.getTime() ? nextOpen : undefined;
  const closed: ApplicationState = upcoming ? { status: "closed", nextOpen: upcoming } : { status: "closed" };

  const open =
    recruiting.mode === "scheduled"
      ? Boolean(nextOpen && now.getTime() >= nextOpen.getTime())
      : recruiting.mode
        ? recruiting.mode === "open"
        : recruiting.applicationsOpen;
  if (!open) return closed;

  if (!recruiting.applyDeadline) return { status: "open" };
  const deadline = parseEasternDateTime(recruiting.applyDeadline);
  return now.getTime() > deadline.getTime() ? closed : { status: "open", deadline };
}
