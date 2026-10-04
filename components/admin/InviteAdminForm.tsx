"use client";

import { UserPlus } from "lucide-react";
import { useActionState } from "react";
import type { ActionState } from "@/app/admin/(console)/admins/actions";
import { Button } from "@/components/admin/ui/Button";
import { controlClasses } from "@/components/admin/ui/Field";
import { cx } from "@/components/admin/ui/cx";

type InviteAdminFormProps = { action: (prev: ActionState, formData: FormData) => Promise<ActionState> };

/** Email field + submit; the result is announced to screen readers. */
export function InviteAdminForm({ action }: InviteAdminFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <label htmlFor="invite-email" className="text-ui-label font-medium text-ui-text">
        Email address
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="invite-email"
          name="email"
          type="email"
          required
          autoComplete="off"
          aria-describedby="invite-status"
          placeholder="name@unc.edu"
          className={cx(controlClasses, "h-9 flex-1")}
        />
        <Button type="submit" variant="primary" icon={UserPlus} pending={pending}>
          {pending ? "Sending…" : "Make admin"}
        </Button>
      </div>
      <p id="invite-status" role="status" className={cx("min-h-4 text-ui-hint", state.error ? "font-medium text-ui-danger" : "text-ui-text-2")}>
        {state.error ?? state.ok ?? ""}
      </p>
    </form>
  );
}
