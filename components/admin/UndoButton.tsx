"use client";

import { Undo2 } from "lucide-react";
import { useActionState } from "react";
import type { ActionState } from "@/lib/admin/action";
import { undoChange } from "@/lib/admin/undo-action";
import { buttonClasses } from "./ui/Button";

/** Undo for one audit entry, in History and the Overview's recent changes (spec 06 §3). */
export function UndoButton({ entryId, label }: { entryId: number; label: string }) {
  const [state, action, pending] = useActionState(undoChange, {} as ActionState);
  return (
    <form action={action} className="flex shrink-0 flex-col items-end">
      <input type="hidden" name="entryId" value={entryId} />
      <button type="submit" disabled={pending} aria-label={`Undo: ${label}`} className={buttonClasses({ variant: "ghost", size: "sm" })}>
        <Undo2 aria-hidden className="size-3.5" />
        {pending ? "Undoing…" : "Undo"}
      </button>
      <p role="status" className="max-w-56 text-right text-ui-hint text-ui-text-2 empty:hidden">
        {state.error ?? state.ok ?? ""}
      </p>
    </form>
  );
}
