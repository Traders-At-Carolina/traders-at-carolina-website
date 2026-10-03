"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { buttonClasses } from "@/components/Button";
import { SaveToast } from "@/components/admin/SaveToast";
import type { ActionState } from "@/lib/admin/action";
import type { MemberSnapshot } from "@/lib/admin/members-db";
import { useUnsavedChanges } from "@/lib/admin/use-unsaved-changes";

const ctl = (bad?: boolean) => `mt-2 min-h-11 w-full border bg-white px-2 text-body focus:border-navy focus:outline-none ${bad ? "border-black" : "border-rule"}`;

/** Edit one roster row (spec 06 §6.2). Notes are admin-only. */
export function MemberForm({ member, action, remove }: { member: MemberSnapshot; action: (p: ActionState, f: FormData) => Promise<ActionState>; remove: () => Promise<ActionState> }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});
  const [removeState, removeAction, removing] = useActionState<ActionState>(remove, {});
  const [dirty, setDirty] = useState(false);
  const [seenAt, setSeenAt] = useState(state.at);
  if (state.at !== seenAt) {
    setSeenAt(state.at);
    if (state.ok) setDirty(false);
  }
  useUnsavedChanges(dirty && !pending);
  useEffect(() => {
    if (removeState.redirectTo) router.push(removeState.redirectTo);
  }, [removeState.redirectTo, router]);
  const err = state.fieldErrors ?? {};
  const field = (name: keyof typeof err) => (err[name] ? <p className="mt-1 text-caption text-black">{err[name]}</p> : null);

  return (
    <>
      <form action={formAction} onChange={() => setDirty(true)} className="grid max-w-2xl gap-5 sm:grid-cols-2" noValidate>
        <label className="text-caption font-medium text-ink-2">
          Name
          <input name="name" defaultValue={member.name} aria-invalid={Boolean(err.name)} className={ctl(Boolean(err.name))} />
          {field("name")}
        </label>
        <label className="text-caption font-medium text-ink-2">
          Email
          <input name="email" type="email" defaultValue={member.email} aria-invalid={Boolean(err.email)} className={ctl(Boolean(err.email))} />
          {field("email")}
        </label>
        <label className="text-caption font-medium text-ink-2">
          Status
          <select name="status" defaultValue={member.status} className={ctl()}>
            <option value="active">Active</option>
            <option value="alumni">Alumni</option>
            <option value="inactive">Inactive (no member access)</option>
          </select>
        </label>
        <label className="text-caption font-medium text-ink-2">
          Track
          <select name="track" defaultValue={member.track ?? ""} className={ctl()}>
            <option value="">None</option>
            <option value="trading">Trading</option>
            <option value="research">Research</option>
            <option value="development">Development</option>
          </select>
        </label>
        <label className="text-caption font-medium text-ink-2">
          Class year
          <input name="classYear" inputMode="numeric" defaultValue={member.classYear ?? ""} aria-invalid={Boolean(err.classYear)} className={ctl(Boolean(err.classYear))} />
          {field("classYear")}
        </label>
        <label className="text-caption font-medium text-ink-2">
          Cohort
          <input name="cohort" defaultValue={member.cohort ?? ""} placeholder="Fall 2026" className={ctl()} />
        </label>
        <label className="text-caption font-medium text-ink-2 sm:col-span-2">
          Notes <span className="font-normal text-ink-3">(admins only)</span>
          <textarea name="notes" rows={3} defaultValue={member.notes ?? ""} className={`${ctl()} py-2`} />
        </label>
        <p className="text-caption text-ink-3 sm:col-span-2">{member.userId ? "Linked to their account." : "Not signed up yet: they become a member when they sign up with this email."}</p>
        {state.error ? (
          <p role="alert" className="text-body text-black sm:col-span-2">
            {state.error}
          </p>
        ) : null}
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending} className={buttonClasses({ className: "disabled:opacity-60" })}>
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
      <form
        action={removeAction}
        onSubmit={(e) => {
          if (!window.confirm(`Remove ${member.name} from the roster? They lose member access on their next page load; their account stays.`)) e.preventDefault();
        }}
        className="mt-10 border-t border-rule pt-6"
      >
        <button type="submit" disabled={removing} className="min-h-11 text-caption font-medium text-navy hover:underline disabled:opacity-60">
          {removing ? "Removing…" : "Remove from roster"}
        </button>
        {removeState.error ? <p className="mt-2 text-caption text-black">{removeState.error}</p> : null}
      </form>
      <SaveToast state={state} />
    </>
  );
}
