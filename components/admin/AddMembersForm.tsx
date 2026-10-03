"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { buttonClasses } from "@/components/Button";
import type { AddState } from "@/app/admin/(console)/members/actions";
import { useUnsavedChanges } from "@/lib/admin/use-unsaved-changes";

type Action = (prev: AddState, formData: FormData) => Promise<AddState>;
const ctl = "mt-2 min-h-11 w-full border border-rule bg-white px-2 text-body focus:border-navy focus:outline-none";

/** Paste or upload, preview, then add (spec 06 §6.2). Nothing is saved until "Add". */
export function AddMembersForm({ preview, add }: { preview: Action; add: Action }) {
  const router = useRouter();
  const [previewState, previewAction, previewing] = useActionState(preview, {});
  const [addState, addAction, adding] = useActionState(add, {});
  const [list, setList] = useState("");
  const [previewedList, setPreviewedList] = useState<string | null>(null);
  useUnsavedChanges(list.trim().length > 0 && !addState.ok);
  useEffect(() => {
    if (addState.redirectTo) router.push(addState.redirectTo);
  }, [addState.redirectTo, router]);

  const shown = previewedList === list ? previewState.preview : undefined;
  const state = addState.at && addState.at > (previewState.at ?? 0) ? addState : previewState;

  return (
    <form className="flex flex-col gap-6">
      <div>
        <label htmlFor="list" className="text-caption font-medium text-ink-2">
          People to add
        </label>
        <textarea
          id="list"
          name="list"
          rows={8}
          value={list}
          onChange={(e) => setList(e.target.value)}
          placeholder={"ada@unc.edu\nGrace Hopper, grace@unc.edu"}
          aria-describedby="list-hint"
          className="mt-2 w-full border border-rule bg-white px-3 py-2 font-mono text-caption focus:border-navy focus:outline-none"
        />
        <p id="list-hint" className="mt-1 text-caption text-ink-3">
          One per line: an email, or “Name, email”. Or upload a CSV with name,email columns and optional track,class_year.
        </p>
        <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center text-caption font-medium text-navy underline underline-offset-4">
          Upload CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setList(await file.text());
            }}
          />
        </label>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-4">
        <legend className="mb-2 text-caption font-medium text-ink-2">Defaults for this batch</legend>
        <label className="text-caption text-ink-2">
          Status
          <select name="status" defaultValue="active" className={ctl}>
            <option value="active">Active</option>
            <option value="alumni">Alumni</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="text-caption text-ink-2">
          Track
          <select name="track" defaultValue="" className={ctl}>
            <option value="">None</option>
            <option value="trading">Trading</option>
            <option value="research">Research</option>
            <option value="development">Development</option>
          </select>
        </label>
        <label className="text-caption text-ink-2">
          Class year
          <input name="classYear" inputMode="numeric" placeholder="2029" className={ctl} />
        </label>
        <label className="text-caption text-ink-2">
          Cohort
          <input name="cohort" placeholder="Fall 2026" className={ctl} />
        </label>
      </fieldset>

      <label className="flex min-h-11 items-center gap-3 text-body">
        <input type="checkbox" name="invite" className="size-5" />
        Email them a sign-up link (people who already have an account are skipped)
      </label>

      {state.error ? (
        <p role="alert" className="text-body text-black">
          {state.error}
        </p>
      ) : null}

      {shown ? (
        <section aria-label="Preview" className="border border-rule bg-white p-4">
          <p className="text-body text-black">
            {shown.add.length} new · {shown.existing.length} already on the roster · {shown.duplicates.length} repeated · {shown.invalid.length} invalid
          </p>
          {shown.invalid.length ? (
            <ul className="mt-3 list-disc pl-5 text-caption text-ink-2">
              {shown.invalid.map((r) => (
                <li key={r.line}>
                  Line {r.line}: {r.reason} (“{r.text}”)
                </li>
              ))}
            </ul>
          ) : null}
          {shown.existing.length ? <p className="mt-3 text-caption text-ink-2">Already on the roster: {shown.existing.map((r) => r.email).join(", ")}</p> : null}
          {shown.add.length ? <p className="mt-3 text-caption text-ink-2">New: {shown.add.map((r) => r.email).join(", ")}</p> : null}
        </section>
      ) : null}

      <div className="flex flex-wrap gap-4">
        <button type="submit" formAction={async (fd) => { setPreviewedList(list); previewAction(fd); }} disabled={previewing} className={buttonClasses({ variant: "secondary", className: "disabled:opacity-60" })}>
          {previewing ? "Checking…" : "Preview"}
        </button>
        <button type="submit" formAction={addAction} disabled={adding || !shown || shown.add.length === 0} className={buttonClasses({ className: "disabled:opacity-50" })}>
          {adding ? "Adding…" : shown ? `Add ${shown.add.length}` : "Add"}
        </button>
      </div>
    </form>
  );
}
