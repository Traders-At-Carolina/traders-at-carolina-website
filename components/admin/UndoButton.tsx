"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/admin/action";
import { undoChange } from "@/lib/admin/undo-action";

/** Undo for one audit entry, in History and the Overview's recent changes (spec 06 §3). */
export function UndoButton({ entryId, label }: { entryId: number; label: string }) {
  const [state, action, pending] = useActionState(undoChange, {} as ActionState);
  return (
    <form action={action} className="flex flex-col items-end">
      <input type="hidden" name="entryId" value={entryId} />
      <button type="submit" disabled={pending} aria-label={`Undo: ${label}`} className="min-h-11 px-2 text-caption font-medium text-navy hover:underline disabled:opacity-60">
        {pending ? "Undoing…" : "Undo"}
      </button>
      <p role="status" className="max-w-56 text-right text-caption text-ink-2">
        {state.error ?? state.ok ?? ""}
      </p>
    </form>
  );
}
