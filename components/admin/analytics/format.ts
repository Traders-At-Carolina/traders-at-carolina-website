const whole = new Intl.NumberFormat("en-US");

export const formatCount = (n: number) => whole.format(Math.round(n));

/** 0.4213 → "42%". */
export const formatPercent = (ratio: number) => `${Math.round(ratio * 100)}%`;

/** 134 → "2m 14s"; 42 → "42s"; 3700 → "1h 1m". */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/** "just now", "1 min ago", "4 min ago". */
export function formatUpdated(fetchedAt: number, now = Date.now()): string {
  const minutes = Math.floor((now - fetchedAt) / 60000);
  if (minutes < 1) return "Updated just now";
  return `Updated ${minutes} min ago`;
}

const shortDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** "2026-10-04" → "Oct 4". The day is already an Eastern calendar date, so format it in UTC to avoid shifting it. */
export const formatDay = (day: string) => shortDay.format(new Date(`${day}T00:00:00Z`));
