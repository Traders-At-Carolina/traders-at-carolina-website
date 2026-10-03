"use client";

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

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center md:justify-end">
      {visible ? (
        <div
          role="status"
          className="pointer-events-auto flex max-w-xl flex-wrap items-center gap-x-4 gap-y-2 rounded-[0.625rem] border border-rule bg-black px-4 py-3 text-body text-bone shadow-[0_10px_30px_-12px_rgb(0_0_0/0.4)]"
        >
          <span>{current.error ?? current.ok}</span>
          {current.ok && current.undoId && current === state ? (
            <form action={undo}>
              <input type="hidden" name="entryId" value={current.undoId} />
              <button type="submit" disabled={undoing} className="min-h-11 font-semibold underline underline-offset-4 disabled:opacity-60">
                {undoing ? "Undoing…" : "Undo"}
              </button>
            </form>
          ) : null}
          {current.ok && current.viewHref ? (
            <a href={current.viewHref} target="_blank" rel="noopener noreferrer" className="min-h-11 content-center font-semibold underline underline-offset-4">
              View on site
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
          <button type="button" onClick={() => setHiddenAt(current.at)} aria-label="Dismiss" className="ml-auto min-h-11 min-w-11 text-bone/80 hover:text-bone">
            ✕
          </button>
        </div>
      ) : null}
    </div>
  );
}
