"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/admin/(console)/admins/actions";

type RowActionFormProps = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  label: string;
  /** Accessible name, e.g. "Remove Jane Doe as admin". */
  ariaLabel: string;
  confirm: string;
};

/** One destructive row action (remove admin, revoke invite) behind a native confirm, with its result announced. */
export function RowActionForm({ action, fields, label, ariaLabel, confirm: question }: RowActionFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(question)) event.preventDefault();
      }}
      className="flex flex-col items-end gap-1"
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" disabled={pending} aria-label={ariaLabel} className="min-h-11 px-2 text-caption font-medium text-navy hover:underline disabled:opacity-60">
        {pending ? "Working…" : label}
      </button>
      <p role="status" className="text-caption text-ink-2">
        {state.error ?? state.ok ?? ""}
      </p>
    </form>
  );
}
