import type { Recruiting } from "@/content/types";
import type { ApplicationState } from "@/lib/applications";
import { parseEasternDateTime } from "@/lib/eastern-time";
import { formatMonthDay, formatTime, formatWeekdayMonthDay } from "@/lib/format";

export type ApplyAction = { label: string; href: string; external: boolean };

export type StatusCopy = {
  eyebrow: string;
  title: string;
  statusLine?: string;
  lead?: string;
  action?: ApplyAction;
  secondary: { label: string; href: string };
};

const futureNextOpen = (state: ApplicationState, now: Date) =>
  state.status === "closed" && state.nextOpen && state.nextOpen.getTime() > now.getTime() ? state.nextOpen : undefined;

/** Status block copy for the /apply header in each state (spec 05 §4.1). */
export function applyStatusCopy(state: ApplicationState, recruiting: Recruiting, contactEmail: string | undefined, now: Date): StatusCopy {
  if (state.status === "open") {
    return {
      eyebrow: recruiting.cycleLabel ? `Apply · ${recruiting.cycleLabel}` : "Apply",
      title: "Applications are open.",
      statusLine: state.deadline
        ? `Due ${formatWeekdayMonthDay(state.deadline)} at ${formatTime(state.deadline)} ET`
        : undefined,
      lead: recruiting.applicationMinutes ? `The application takes about ${recruiting.applicationMinutes} minutes.` : undefined,
      action: { label: "Apply", href: recruiting.applyUrl, external: true },
      secondary: { label: "Review the process", href: "#process" },
    };
  }

  const nextOpen = futureNextOpen(state, now);
  const interest = recruiting.interestFormUrl;
  return {
    eyebrow: "Apply",
    title: "We're between cycles.",
    statusLine: `Applications aren't open right now. ${
      nextOpen ? `Our next cycle opens ${formatWeekdayMonthDay(nextOpen)}.` : "We open applications each fall and spring."
    }`,
    lead: interest ? "Leave your email and we'll tell you the moment the next cycle opens." : undefined,
    action: interest ? { label: "Keep me posted", href: interest, external: true } : undefined,
    secondary:
      !interest && contactEmail
        ? { label: "Email us", href: `mailto:${contactEmail}` }
        : { label: "Read the FAQ", href: "#faq" },
  };
}

/** "Feb 10–14", "Feb 28–Mar 3", or "Feb 10" for a single day. */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = parseEasternDateTime(startIso);
  const end = parseEasternDateTime(endIso);
  const a = formatMonthDay(start);
  const b = formatMonthDay(end);
  if (a === b) return a;
  const [aMonth] = a.split(" ");
  const [bMonth, bDay] = b.split(" ");
  return aMonth === bMonth ? `${a}–${bDay}` : `${a}–${b}`;
}

/** Date column for Application, Interview and Decision; undefined falls back to generic timing (spec 05 §4.2). */
export function stageDates(state: ApplicationState, recruiting: Recruiting): Array<string | undefined> {
  if (state.status === "closed") return [undefined, undefined, undefined];
  const { applyDeadline, interviewWindow, decisionDate } = recruiting;
  return [
    applyDeadline ? `Due ${formatMonthDay(parseEasternDateTime(applyDeadline))}` : undefined,
    interviewWindow ? formatDateRange(interviewWindow.start, interviewWindow.end) : undefined,
    decisionDate ? `By ${formatMonthDay(parseEasternDateTime(decisionDate))}` : undefined,
  ];
}
