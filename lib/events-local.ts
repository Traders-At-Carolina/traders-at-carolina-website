/** "2026-10-16T19:00" plus whole days, at the same wall-clock time (DST-safe: no instants involved). */
export function shiftLocal(value: string, days: number): string {
  const [date, time] = value.split("T");
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.toISOString().slice(0, 10)}T${time}`;
}
