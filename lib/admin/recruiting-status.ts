import type { Recruiting } from "@/content/types";
import { getApplicationState } from "@/lib/applications";

const when = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });

export type RecruitingStatus = {
  pill: "open" | "closed" | "scheduled";
  /** "Open", "Closed" or "Scheduled". */
  label: string;
  /** "closes Fri, Oct 9, 11:59 PM ET", "opens automatically …", or undefined. */
  detail?: string;
};

/** What the site shows right now, worded for the console (Recruiting status card, Overview tile). */
export function recruitingStatus(now: Date, recruiting: Recruiting): RecruitingStatus {
  const state = getApplicationState(now, recruiting);
  if (state.status === "open") {
    return { pill: "open", label: "Open", detail: state.deadline ? `closes ${when.format(state.deadline)} ET` : "no deadline set" };
  }
  if (state.nextOpen) {
    const scheduled = recruiting.mode === "scheduled";
    return { pill: scheduled ? "scheduled" : "closed", label: scheduled ? "Scheduled" : "Closed", detail: `${scheduled ? "opens automatically" : "next opens"} ${when.format(state.nextOpen)} ET` };
  }
  return { pill: "closed", label: "Closed" };
}
