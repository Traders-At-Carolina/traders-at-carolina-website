import type { ClubEvent, EventType } from "@/content/types";
import { parseEasternDateTime } from "@/lib/eastern-time";
import { formatEventDateTime, formatTime } from "@/lib/format";
import { isUpcoming } from "@/lib/home";

const startOf = (event: ClubEvent) => parseEasternDateTime(event.startsAt).getTime();

/** Events that haven't finished (through the end of their last day, Eastern time), soonest first (spec 09 §4.4). */
export function upcomingEvents(events: ClubEvent[], now: Date): ClubEvent[] {
  return events.filter((event) => isUpcoming(event.endsAt ?? event.startsAt, now)).sort((a, b) => startOf(a) - startOf(b));
}

/** Home's Upcoming card: the next featured public event, the rule spec 06 phase 6 keeps (spec 01 §3.4). */
export function nextFeaturedEvent(events: ClubEvent[], now: Date): ClubEvent | undefined {
  return upcomingEvents(
    events.filter((event) => event.audience === "public" && event.featured),
    now,
  )[0];
}

const TYPE_LABELS: Record<EventType, string> = {
  "general-meeting": "General meeting",
  workshop: "Workshop",
  speaker: "Speaker event",
  competition: "Competition",
  social: "Social",
  recruiting: "Recruiting",
  other: "Event",
};

/** The card label for an event's type. */
export function eventTypeLabel(type: EventType): string {
  return TYPE_LABELS[type];
}

/** "Thu, Oct 16 · 7:00 PM", with "–8:30 PM" for an end the same day, or " – Sat, Oct 18 · 5:00 PM" across days. */
export function formatEventWhen(event: Pick<ClubEvent, "startsAt" | "endsAt">): string {
  const start = formatEventDateTime(parseEasternDateTime(event.startsAt));
  if (!event.endsAt) return start;
  const end = parseEasternDateTime(event.endsAt);
  return event.startsAt.slice(0, 10) === event.endsAt.slice(0, 10) ? `${start}–${formatTime(end)}` : `${start} – ${formatEventDateTime(end)}`;
}
