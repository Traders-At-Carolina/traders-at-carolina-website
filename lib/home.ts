import type { Recruiting } from "@/content/types";
import type { ApplicationState } from "@/lib/applications";
import { parseEasternDateTime } from "@/lib/eastern-time";
import { formatWeekdayMonthDay } from "@/lib/format";

/** An event stays "upcoming" through the end of its day in Eastern time (spec 01 §3.4). */
export function isUpcoming(isoDateTime: string, now: Date): boolean {
  const endOfEventDay = parseEasternDateTime(isoDateTime.slice(0, 10));
  return endOfEventDay.getTime() >= now.getTime();
}

/** Sequential § numbers for the sections that actually render. */
export function numberSections<K extends string>(keys: K[]): Record<K, number> {
  return Object.fromEntries(keys.map((key, i) => [key, i + 1])) as Record<K, number>;
}

export type HomeAction = { label: string; href: string; external: boolean; arrow: boolean };

export type HomeApplyCopy = {
  /** `status` is a one-line note under the hero button, shown when applications are closed. */
  hero: HomeAction & { status?: string };
  band: HomeAction & { title: string; lead?: string };
};

/**
 * Hero and Apply-band copy for each application state (spec 01 §5). When closed, both buttons go
 * straight to the interest form if there is one, so "Get notified" never lands on a dead end.
 */
export function homeApplyCopy(state: ApplicationState, recruiting: Recruiting, now: Date): HomeApplyCopy {
  if (state.status === "open") {
    const apply = { label: "Apply", href: recruiting.applyUrl, external: true, arrow: false };
    return {
      hero: apply,
      band: {
        ...apply,
        title: "Ready to start?",
        lead: state.deadline ? `Applications close ${formatWeekdayMonthDay(state.deadline)}.` : undefined,
      },
    };
  }

  const nextOpen = state.nextOpen && state.nextOpen.getTime() > now.getTime() ? state.nextOpen : undefined;
  const when = nextOpen ? `The next cycle opens ${formatWeekdayMonthDay(nextOpen)}.` : "We recruit each fall and spring.";
  const action: HomeAction = recruiting.interestFormUrl
    ? { label: "Get notified", href: recruiting.interestFormUrl, external: true, arrow: false }
    : { label: "How to apply", href: "/apply", external: false, arrow: true };
  return {
    hero: { ...action, status: `Applications are closed. ${when}` },
    band: {
      ...action,
      title: "Applications are closed for now.",
      lead: recruiting.interestFormUrl ? `${when} Leave your email and we'll tell you when they open.` : when,
    },
  };
}
