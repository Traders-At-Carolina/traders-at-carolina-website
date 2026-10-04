"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { SaveToast } from "@/components/admin/SaveToast";
import { Button } from "@/components/admin/ui/Button";
import { Card, CardSection } from "@/components/admin/ui/Card";
import { ConfirmDialog } from "@/components/admin/ui/Dialog";
import { Field, Input, Select, Textarea } from "@/components/admin/ui/Field";
import { FormFooter } from "@/components/admin/ui/Form";
import type { ActionState } from "@/lib/admin/action";
import type { MemberSnapshot } from "@/lib/admin/members-db";
import { useUnsavedChanges } from "@/lib/admin/use-unsaved-changes";

/** Edit one roster row (spec 06 §6.2). Notes are admin-only. */
export function MemberForm({ member, action, remove }: { member: MemberSnapshot; action: (p: ActionState, f: FormData) => Promise<ActionState>; remove: () => Promise<ActionState> }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});
  const [removeState, removeAction, removing] = useActionState<ActionState>(remove, {});
  const [dirty, setDirty] = useState(false);
  const [seenAt, setSeenAt] = useState(state.at);
  const [confirming, setConfirming] = useState(false);
  const removeForm = useRef<HTMLFormElement>(null);
  if (state.at !== seenAt) {
    setSeenAt(state.at);
    if (state.ok) setDirty(false);
  }
  useUnsavedChanges(dirty && !pending);
  useEffect(() => {
    if (removeState.redirectTo) router.push(removeState.redirectTo);
  }, [removeState.redirectTo, router]);
  const err = state.fieldErrors ?? {};

  return (
    <div className="max-w-3xl">
      <form action={formAction} onChange={() => setDirty(true)} noValidate>
        <Card as="div">
          <CardSection>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" error={err.name}>
                <Input name="name" defaultValue={member.name} />
              </Field>
              <Field label="Email" error={err.email}>
                <Input name="email" type="email" defaultValue={member.email} />
              </Field>
              <Field label="Status">
                <Select name="status" defaultValue={member.status}>
                  <option value="active">Active</option>
                  <option value="alumni">Alumni</option>
                  <option value="inactive">Inactive (no member access)</option>
                </Select>
              </Field>
              <Field label="Track">
                <Select name="track" defaultValue={member.track ?? ""}>
                  <option value="">None</option>
                  <option value="trading">Trading</option>
                  <option value="research">Research</option>
                  <option value="development">Development</option>
                </Select>
              </Field>
              <Field label="Class year" error={err.classYear}>
                <Input name="classYear" inputMode="numeric" defaultValue={member.classYear ?? ""} className="tabular-nums" />
              </Field>
              <Field label="Cohort">
                <Input name="cohort" defaultValue={member.cohort ?? ""} placeholder="Fall 2026" />
              </Field>
              <Field label="Notes" hint="Only admins see these." className="sm:col-span-2">
                <Textarea name="notes" rows={3} defaultValue={member.notes ?? ""} />
              </Field>
              <p className="text-ui-hint text-ui-text-3 sm:col-span-2">{member.userId ? "Linked to their account." : "Not signed up yet: they become a member when they sign up with this email."}</p>
            </div>
          </CardSection>
          <FormFooter pending={pending} dirty={dirty} submitLabel="Save" cancelHref="/admin/members" error={state.error} />
        </Card>
      </form>
      <form ref={removeForm} action={removeAction} className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-ui-lg border border-ui-danger/25 bg-ui-surface px-6 py-4 shadow-ui-card">
        <div>
          <p className="text-ui-base font-medium text-ui-text">Remove from roster</p>
          <p className="mt-0.5 text-ui-label text-ui-text-2">They lose member access; their account stays. You can undo this right after.</p>
          {removeState.error ? <p className="mt-1 text-ui-label font-medium text-ui-danger">{removeState.error}</p> : null}
        </div>
        <Button variant="secondary" icon={Trash2} pending={removing} onClick={() => setConfirming(true)} className="text-ui-danger">
          {removing ? "Removing…" : "Remove from roster"}
        </Button>
        <ConfirmDialog
          open={confirming}
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            removeForm.current?.requestSubmit();
          }}
          title={`Remove ${member.name} from the roster?`}
          description="They lose member access on their next page load; their account stays."
          confirmLabel="Remove"
        />
      </form>
      <SaveToast state={state} />
    </div>
  );
}
