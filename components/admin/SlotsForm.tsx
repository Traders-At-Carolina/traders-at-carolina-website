"use client";

import { useActionState, useState } from "react";
import { buttonClasses } from "@/components/Button";
import { SaveToast } from "@/components/admin/SaveToast";
import type { ActionState } from "@/lib/admin/action";
import { useUnsavedChanges } from "@/lib/admin/use-unsaved-changes";

type SlotsFormProps = {
  page: "home" | "membership";
  title: string;
  /** "Hidden until…" hint and what each slot does (spec 06 §6.0). */
  hint: string;
  slotLabels: [string, string, string];
  options: Array<{ id: string; caption: string }>;
  slots: [string | null, string | null, string | null];
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
};

/** Three slot pickers for one page, saved (and undone) as one change. */
export function SlotsForm({ page, title, hint, slotLabels, options, slots, action }: SlotsFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [values, setValues] = useState(slots.map((s) => s ?? ""));
  const [baseline, setBaseline] = useState(values);
  const dirty = values.some((v, i) => v !== baseline[i]);
  useUnsavedChanges(dirty && !pending);
  const [confirmEmpty, setConfirmEmpty] = useState("");
  // A new successful save becomes the unsaved-changes baseline (adjusting state while rendering, not in an effect).
  const [seenAt, setSeenAt] = useState(state.at);
  if (state.at !== seenAt) {
    setSeenAt(state.at);
    if (state.ok) setBaseline(values);
  }
  const headingId = `slots-${page}-title`;

  return (
    <section aria-labelledby={headingId} className="border-t border-rule pt-6">
      <h2 id={headingId} className="text-h3">
        {title}
      </h2>
      <p className="mt-2 max-w-prose text-caption text-ink-2">{hint}</p>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (values.every((v) => !v)) {
            if (!window.confirm(`Clear every slot? The ${title.toLowerCase()} section will be hidden.`)) e.preventDefault();
            else setConfirmEmpty("yes");
          }
        }}
        className="mt-4 flex flex-col gap-4"
      >
        <input type="hidden" name="page" value={page} />
        <input type="hidden" name="confirmEmpty" value={confirmEmpty} />
        <div className="grid gap-4 sm:grid-cols-3">
          {slotLabels.map((label, i) => (
            <div key={label}>
              <label htmlFor={`${page}-slot${i + 1}`} className="text-caption font-medium text-ink-2">
                {label}
              </label>
              <select
                id={`${page}-slot${i + 1}`}
                name={`slot${i + 1}`}
                value={values[i]}
                onChange={(e) => setValues(values.map((v, j) => (j === i ? e.target.value : v)))}
                className="mt-2 min-h-11 w-full border border-rule bg-white px-2 text-body focus:border-navy focus:outline-none"
              >
                <option value="">Empty</option>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.caption}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        {state.error ? (
          <p role="alert" className="text-body text-black">
            {state.error}
          </p>
        ) : null}
        <div>
          <button type="submit" disabled={pending || !dirty} className={buttonClasses({ variant: "secondary", className: "disabled:opacity-50" })}>
            {pending ? "Saving…" : `Save ${title.toLowerCase()}`}
          </button>
        </div>
      </form>
      <SaveToast state={state} />
    </section>
  );
}
