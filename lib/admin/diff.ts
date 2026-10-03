export type FieldChange = { field: string; before: unknown; after: unknown };

/** Field-by-field difference between two audit snapshots (spec 06 §6.16). Null on either side means create/delete. */
export function changedFields(before: Record<string, unknown> | null, after: Record<string, unknown> | null): FieldChange[] {
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])];
  return keys
    .filter((k) => JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k]))
    .map((field) => ({ field, before: before?.[field], after: after?.[field] }));
}
