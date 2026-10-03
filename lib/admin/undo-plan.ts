export type UndoableEntry = { id: number; entity: string; entityId: string | null; before: unknown; after: unknown };

export type UndoPlan =
  | { kind: "restore"; state: Record<string, unknown> }
  | { kind: "remove" }
  | { kind: "recreate"; state: Record<string, unknown> }
  | { kind: "refuse"; reason: string };

/**
 * What undoing an audit entry means (spec 06 §3). `latestId` is the newest entry for the same item: undo only
 * applies to that one, so it never silently overwrites a later change.
 */
export function planUndo(entry: UndoableEntry, latestId: number): UndoPlan {
  if (!entry.entityId || (entry.before == null && entry.after == null)) return { kind: "refuse", reason: "This change can't be undone." };
  if (latestId !== entry.id) return { kind: "refuse", reason: "This item has changed since. Undo the newer change first." };
  if (entry.before == null) return { kind: "remove" };
  if (entry.after == null) return { kind: "recreate", state: entry.before as Record<string, unknown> };
  return { kind: "restore", state: entry.before as Record<string, unknown> };
}
