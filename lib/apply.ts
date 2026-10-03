import type { ApplyContent, Recruiting } from "@/content/types";
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
  /** Reassurance under the action, e.g. "Name and email only · No experience needed to apply". */
  note?: string;
  /** Omitted when it would compete with the one action (closed, with an interest form). */
  secondary?: { label: string; href: string };
};

export type BandCopy = { title: string; lead?: string; action: ApplyAction };

const futureNextOpen = (state: ApplicationState, now: Date) =>
  state.status === "closed" && state.nextOpen && state.nextOpen.getTime() > now.getTime() ? state.nextOpen : undefined;

const NO_EXPERIENCE = "No experience needed to apply";

/** Status block copy for the /apply header in each state (spec 05 §4.1). Closed leads with the action, not the negative. */
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
      note: NO_EXPERIENCE,
      secondary: { label: "Review the process", href: "#process" },
    };
  }

  const nextOpen = futureNextOpen(state, now);
  const interest = recruiting.interestFormUrl;
  const when = nextOpen ? `The next cycle opens ${formatWeekdayMonthDay(nextOpen)}.` : "We recruit each fall and spring.";
  if (interest) {
    return {
      eyebrow: "Apply",
      title: "Be first to know when applications open.",
      statusLine: `Applications are closed · ${when}`,
      lead: "Leave your email and we'll let you know as soon as the next cycle opens.",
      action: { label: "Keep me posted", href: interest, external: true },
      note: `Name and email only · ${NO_EXPERIENCE}`,
    };
  }
  return {
    eyebrow: "Apply",
    title: "Applications are closed.",
    statusLine: when,
    secondary: contactEmail ? { label: "Email us", href: `mailto:${contactEmail}` } : { label: "Read the FAQ", href: "#faq" },
  };
}

/** The one action for the closed state when there's no interest form: email, else the FAQ. */
function closedFallback(contactEmail: string | undefined): ApplyAction {
  return contactEmail
    ? { label: "Email us", href: `mailto:${contactEmail}`, external: false }
    : { label: "Read the FAQ", href: "#faq", external: false };
}

/** Navy band copy for /apply. Closed looks ahead to the next cycle rather than repeating "closed" (spec 05 §4.4). */
export function applyBandCopy(state: ApplicationState, recruiting: Recruiting, contactEmail: string | undefined, now: Date): BandCopy {
  if (state.status === "open") {
    return {
      title: "Ready when you are.",
      lead: state.deadline ? `Applications close ${formatWeekdayMonthDay(state.deadline)}.` : undefined,
      action: { label: "Apply", href: recruiting.applyUrl, external: true },
    };
  }
  const nextOpen = futureNextOpen(state, now);
  if (recruiting.interestFormUrl) {
    return {
      title: "Don't miss the next cycle.",
      lead: nextOpen
        ? `Applications open ${formatWeekdayMonthDay(nextOpen)}. We'll email you when they do.`
        : "We'll email you when applications open.",
      action: { label: "Keep me posted", href: recruiting.interestFormUrl, external: true },
    };
  }
  return { title: "Applications are closed for now.", action: closedFallback(contactEmail) };
}

/** The action that sits under "What you get": the same destination as the header, in a quieter style. */
export function applyPrimaryAction(state: ApplicationState, recruiting: Recruiting, contactEmail: string | undefined): ApplyAction {
  if (state.status === "open") return { label: "Apply", href: recruiting.applyUrl, external: true };
  return recruiting.interestFormUrl
    ? { label: "Keep me posted", href: recruiting.interestFormUrl, external: true }
    : closedFallback(contactEmail);
}

/** Lead over the process rail on /apply and the portal: names the cycle while it's open (spec 05 §4.3). */
export function processLead(state: ApplicationState, cycleLabel?: string): string {
  return state.status === "open" && cycleLabel
    ? `We recruit each fall and spring. Here's how the ${cycleLabel} cycle works.`
    : "We open applications each fall and spring. Here's how a typical cycle works.";
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

/** FAQ items for this deployment: drafts show in development and previews, never on Vercel production. */
export function visibleFaq(faq: ApplyContent["faq"], vercelEnv: string | undefined = process.env.VERCEL_ENV): ApplyContent["faq"] {
  return vercelEnv === "production" ? faq.filter((item) => !item.draft) : faq;
}

/** Effort line per stage; the Application stage states the real length when applicationMinutes is set. */
export function stageEfforts(stages: ApplyContent["stages"], recruiting: Recruiting): Array<string | undefined> {
  return stages.map((stage, i) =>
    i === 0 && recruiting.applicationMinutes ? `About ${recruiting.applicationMinutes} minutes` : stage.effort,
  );
}
