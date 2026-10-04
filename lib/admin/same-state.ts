/**
 * Undo's "still looks as the change left it" test (spec 06 §3). Postgres jsonb reorders object keys, so a row read back
 * from the database rarely stringifies the same as the snapshot stored in the audit log; compare with sorted keys,
 * dates as ISO strings and undefined fields dropped.
 */
export function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter((k) => (value as Record<string, unknown>)[k] !== undefined)
        .map((k) => [k, canonical((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}
export const sameState = (a: unknown, b: unknown) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
