import type { Recruiting } from "@/content/types";
import type { ApplicationState } from "@/lib/applications";
import { parseEasternDateTime } from "@/lib/eastern-time";
import { formatMonthDay } from "@/lib/format";

/** An event stays "upcoming" through the end of its day in Eastern time (spec 01 §3.4). */
export function isUpcoming(isoDateTime: string, now: Date): boolean {
  const endOfEventDay = parseEasternDateTime(isoDateTime.slice(0, 10));
  return endOfEventDay.getTime() >= now.getTime();
}

/** Sequential § numbers for the sections that actually render. */
export function numberSections<K extends string>(keys: K[]): Record<K, number> {
  return Object.fromEntries(keys.map((key, i) => [key, i + 1])) as Record<K, number>;
}

export type HomeApplyCopy = {
  hero: { label: string; href: string; external: boolean; arrow: boolean };
  band: { title: string; label: string; href: string; external: boolean };
};

/** Hero and Apply-band button copy for each application state (spec 01 §5). */
export function homeApplyCopy(state: ApplicationState, recruiting: Recruiting, now: Date): HomeApplyCopy {
  if (state.status === "open") {
    return {
      hero: { label: "Apply", href: recruiting.applyUrl, external: true, arrow: false },
      band: { title: "Ready to start?", label: "Apply", href: recruiting.applyUrl, external: true },
    };
  }

  const nextOpen = state.nextOpen && state.nextOpen.getTime() > now.getTime() ? state.nextOpen : undefined;
  return {
    hero: nextOpen
      ? { label: `Applications open ${formatMonthDay(nextOpen)}`, href: "/apply", external: false, arrow: false }
      : { label: "How to apply", href: "/apply", external: false, arrow: true },
    band: { title: "Applications are closed for now.", label: "Get notified", href: "/apply", external: false },
  };
}
