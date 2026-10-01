const TIME_ZONE = "America/New_York";

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

const monthDayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  month: "short",
  day: "numeric",
});

// Newer ICU versions insert a narrow no-break space before AM/PM.
const normalize = (s: string) => s.replace(/ /g, " ");

/** "Thu, Oct 16 · 7:00 PM" in Eastern time (spec 01 §3.4). */
export function formatEventDateTime(date: Date): string {
  return `${normalize(dayFormatter.format(date))} · ${normalize(timeFormatter.format(date))}`;
}

/** "Fri, Feb 6" in Eastern time. */
export function formatWeekdayMonthDay(date: Date): string {
  return normalize(dayFormatter.format(date));
}

/** "11:59 PM" in Eastern time. */
export function formatTime(date: Date): string {
  return normalize(timeFormatter.format(date));
}

/** "Jan 12" in Eastern time. */
export function formatMonthDay(date: Date): string {
  return normalize(monthDayFormatter.format(date));
}
