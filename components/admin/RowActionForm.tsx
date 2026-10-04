"use client";

import { useActionState, useRef, useState } from "react";
import type { ActionState } from "@/app/admin/(console)/admins/actions";
import { Button } from "@/components/admin/ui/Button";
import { ConfirmDialog } from "@/components/admin/ui/Dialog";
import { cx } from "@/components/admin/ui/cx";

type RowActionFormProps = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  label: string;
  /** Accessible name, e.g. "Remove Jane Doe as admin". */
  ariaLabel: string;
  confirm: string;
};

/** One destructive row action (remove admin, revoke invite) behind a ConfirmDialog, with its result announced. */
export function RowActionForm({ action, fields, label, ariaLabel, confirm: question }: RowActionFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [confirming, setConfirming] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  // "Remove X as an admin? Their account stays…" → the question as the title, the consequence as the description.
  const split = question.indexOf("? ");
  const title = split >= 0 ? question.slice(0, split + 1) : question;
  const description = split >= 0 ? question.slice(split + 2) : undefined;
  return (
    <form ref={form} action={formAction} className="flex flex-col items-end gap-1">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button size="sm" pending={pending} aria-label={ariaLabel} onClick={() => setConfirming(true)} className="text-ui-danger">
        {pending ? "Working…" : label}
      </Button>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          form.current?.requestSubmit();
        }}
        title={title}
        description={description}
        confirmLabel={label}
      />
      <p role="status" className={cx("max-w-56 text-right text-ui-hint empty:hidden", state.error ? "font-medium text-ui-danger" : "text-ui-text-2")}>
        {state.error ?? state.ok ?? ""}
      </p>
    </form>
  );
}
