"use client";

import { CircleCheck, TriangleAlert, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import type { ActionState } from "@/lib/admin/action";
import { undoChange } from "@/lib/admin/undo-action";

/**
 * "Saved · live in a few seconds", with Undo and View on site (spec 06 §6.0). Shows for each new save result (keyed
 * on `at`), stays until dismissed or 12 seconds pass, and announces itself politely.
 */
export function SaveToast({ state }: { state: ActionState }) {
  const [undoState, undo, undoing] = useActionState(undoChange, {} as ActionState);
  const [hiddenAt, setHiddenAt] = useState<number | undefined>(undefined);
  const current = undoState.at && undoState.at > (state.at ?? 0) ? undoState : state;
  const visible = Boolean(current.ok || current.error) && hiddenAt !== current.at;

  useEffect(() => {
    if (!current.at || current.error) return;
    const timer = window.setTimeout(() => setHiddenAt(current.at), 12000);
    return () => window.clearTimeout(timer);
  }, [current.at, current.error]);

  const link = "inline-flex min-h-8 items-center rounded-ui-sm px-2 text-ui-base font-medium text-ui-accent hover:bg-ui-accent-soft disabled:opacity-60";

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center md:justify-end">
      {visible ? (
        <div role="status" className="pointer-events-auto flex max-w-xl animate-ui-pop flex-wrap items-center gap-x-2 gap-y-1 rounded-ui-lg border border-ui-border bg-ui-surface py-2 pr-2 pl-4 text-ui-base text-ui-text shadow-ui-pop">
          {current.error ? <TriangleAlert aria-hidden className="size-4 shrink-0 text-ui-danger" /> : <CircleCheck aria-hidden className="size-4 shrink-0 text-ui-success" />}
          <span className="mr-2">{current.error ?? current.ok}</span>
          {current.ok && current.undoId && current === state ? (
            <form action={undo}>
              <input type="hidden" name="entryId" value={current.undoId} />
              <button type="submit" disabled={undoing} className={link}>
                {undoing ? "Undoing…" : "Undo"}
              </button>
            </form>
          ) : null}
          {current.ok && current.viewHref ? (
            <a href={current.viewHref} target="_blank" rel="noopener noreferrer" className={link}>
              View on site
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
          <button type="button" onClick={() => setHiddenAt(current.at)} aria-label="Dismiss" className="ml-auto inline-flex size-8 items-center justify-center rounded-ui-md text-ui-text-3 hover:bg-ui-subtle hover:text-ui-text">
            <X aria-hidden className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
