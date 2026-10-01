const ISO_LOCAL = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/;

const offsetFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  timeZoneName: "shortOffset",
});

/** Minutes east of UTC for America/New_York at the given instant (e.g. -300 for EST). */
function easternOffsetMinutes(at: Date): number {
  const name = offsetFormatter.formatToParts(at).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(name);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === "-" ? -minutes : minutes;
}

/**
 * Parse an ISO local value as America/New_York wall-clock time.
 * "YYYY-MM-DD" means 23:59 that day; "YYYY-MM-DDTHH:mm" is exact.
 */
export function parseEasternDateTime(iso: string): Date {
  const m = ISO_LOCAL.exec(iso);
  if (!m) throw new Error(`Invalid date "${iso}": expected YYYY-MM-DD or YYYY-MM-DDTHH:mm`);

  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const [hour, minute] = m[4] ? [Number(m[4]), Number(m[5])] : [23, 59];
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute);

  const check = new Date(wallAsUtc);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    throw new Error(`Invalid date "${iso}": out of range`);
  }

  // Two passes settle the offset correctly around DST transitions.
  let utc = wallAsUtc - easternOffsetMinutes(new Date(wallAsUtc)) * 60_000;
  utc = wallAsUtc - easternOffsetMinutes(new Date(utc)) * 60_000;
  return new Date(utc);
}
