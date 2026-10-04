"use client";

import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { SaveToast } from "@/components/admin/SaveToast";
import { Button } from "@/components/admin/ui/Button";
import { ConfirmDialog } from "@/components/admin/ui/Dialog";
import type { ActionState } from "@/lib/admin/action";
import { useSaveForm } from "@/lib/admin/use-save-form";

type Action = (p: ActionState, f: FormData) => Promise<ActionState>;

/**
 * Delete for one score or contact row on /admin/games (spec 11 §5.4): a small button that asks first, saying what else
 * goes, then submits. On success the page moves to ?saved=<entry>, whose toast offers Undo (the row itself is gone).
 * A plain button rather than a Menu: the kit Table scrolls horizontally, which would clip a dropdown.
 */
export function GameRowActions({ action, id, name, title, description }: { action: Action; id: number; name: string; title: string; description: string }) {
  const { state, formAction, pending } = useSaveForm(action);
  const [open, setOpen] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const [seenAt, setSeenAt] = useState(state.at);
  if (state.at !== seenAt) {
    setSeenAt(state.at);
    setOpen(false);
  }
  return (
    <form ref={form} action={formAction} className="flex justify-end">
      <input type="hidden" name="id" value={id} />
      <Button variant="ghost" size="sm" icon={Trash2} pending={pending} onClick={() => setOpen(true)} aria-label={`Delete ${name}`} className="text-ui-danger hover:text-ui-danger">
        <span className="sr-only sm:not-sr-only">Delete</span>
      </Button>
      <ConfirmDialog open={open} onClose={() => setOpen(false)} onConfirm={() => form.current?.requestSubmit()} pending={pending} title={title} description={description} />
      {state.error ? <SaveToast state={state} /> : null}
    </form>
  );
}
