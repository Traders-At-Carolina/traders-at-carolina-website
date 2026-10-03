"use client";

import { useActionState } from "react";
import { buttonClasses } from "@/components/Button";
import type { ActionState } from "@/app/admin/(console)/admins/actions";

type InviteAdminFormProps = { action: (prev: ActionState, formData: FormData) => Promise<ActionState> };

/** Email field + submit; the result is announced to screen readers. */
export function InviteAdminForm({ action }: InviteAdminFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="invite-email" className="text-caption font-medium text-ink-2">
        Email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="invite-email"
          name="email"
          type="email"
          required
          autoComplete="off"
          aria-describedby="invite-status"
          className="min-h-11 flex-1 border border-rule bg-white px-3 text-body focus:border-navy focus:outline-none"
        />
        <button type="submit" disabled={pending} className={buttonClasses({ className: "disabled:opacity-60" })}>
          {pending ? "Sending…" : "Make admin"}
        </button>
      </div>
      <p id="invite-status" role="status" className={`min-h-6 text-caption ${state.error ? "text-black" : "text-ink-2"}`}>
        {state.error ?? state.ok ?? ""}
      </p>
    </form>
  );
}
