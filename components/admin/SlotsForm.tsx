"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { SaveToast } from "@/components/admin/SaveToast";
import { Button } from "@/components/admin/ui/Button";
import { Card, CardHeader, CardSection } from "@/components/admin/ui/Card";
import { ConfirmDialog } from "@/components/admin/ui/Dialog";
import { Banner } from "@/components/admin/ui/Feedback";
import { Field, Select } from "@/components/admin/ui/Field";
import type { ImageAsset } from "@/content/types";
import type { ActionState } from "@/lib/admin/action";
import { useUnsavedChanges } from "@/lib/admin/use-unsaved-changes";

type SlotsFormProps = {
  page: "home" | "membership";
  title: string;
  /** What each slot does (spec 06 §6.0). */
  hint: string;
  /** A "Hidden until…" notice, shown as an info banner (spec 06 §6.0). */
  notice?: string;
  slotLabels: [string, string, string];
  /** Library photos; `image` lets each slot show a thumbnail of its pick. */
  options: Array<{ id: string; caption: string; image?: ImageAsset }>;
  slots: [string | null, string | null, string | null];
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
};

/** Three slot pickers for one page, saved (and undone) as one change. */
export function SlotsForm({ page, title, hint, notice, slotLabels, options, slots, action }: SlotsFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [values, setValues] = useState(slots.map((s) => s ?? ""));
  const [baseline, setBaseline] = useState(values);
  const dirty = values.some((v, i) => v !== baseline[i]);
  useUnsavedChanges(dirty && !pending);
  const [confirmEmpty, setConfirmEmpty] = useState("");
  const [asking, setAsking] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const confirmInput = useRef<HTMLInputElement>(null);
  // A new successful save becomes the unsaved-changes baseline (adjusting state while rendering, not in an effect).
  const [seenAt, setSeenAt] = useState(state.at);
  if (state.at !== seenAt) {
    setSeenAt(state.at);
    if (state.ok) setBaseline(values);
  }
  const headingId = `slots-${page}-title`;
  const byId = new Map(options.map((o) => [o.id, o]));

  return (
    <Card aria-labelledby={headingId}>
      <CardHeader id={headingId} title={title} description={hint} />
      <form
        ref={form}
        action={formAction}
        onSubmit={(e) => {
          if (values.every((v) => !v) && confirmInput.current?.value !== "yes") {
            e.preventDefault();
            setAsking(true);
          }
        }}
      >
        <input type="hidden" name="page" value={page} />
        <input ref={confirmInput} type="hidden" name="confirmEmpty" value={confirmEmpty} />
        <CardSection>
          {notice ? (
            <Banner tone="info" className="mb-4">
              {notice}
            </Banner>
          ) : null}
          <div className="grid gap-5 sm:grid-cols-3">
            {slotLabels.map((label, i) => {
              const picked = values[i] ? byId.get(values[i]) : undefined;
              return (
                <div key={label} className="flex flex-col gap-3">
                  <div className="relative aspect-[3/2] overflow-hidden rounded-ui-md border border-ui-border bg-ui-subtle">
                    {picked?.image ? (
                      <Image src={picked.image} alt="" fill sizes="(min-width: 640px) 240px, 90vw" placeholder={picked.image.blurDataURL ? "blur" : "empty"} className="object-cover" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-1 text-ui-hint text-ui-text-3">
                        <ImageOff aria-hidden className="size-4" />
                        {picked ? picked.caption : "Empty"}
                      </div>
                    )}
                  </div>
                  <Field label={label}>
                    <Select name={`slot${i + 1}`} value={values[i]} onChange={(e) => setValues(values.map((v, j) => (j === i ? e.target.value : v)))}>
                      <option value="">Empty</option>
                      {options.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.caption}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              );
            })}
          </div>
        </CardSection>
        <div className="flex flex-wrap items-center justify-end gap-2 rounded-b-ui-lg border-t border-ui-border bg-ui-surface px-6 py-3">
          {state.error ? (
            <p role="alert" className="mr-auto text-ui-base font-medium text-ui-danger">
              {state.error}
            </p>
          ) : dirty && !pending ? (
            <p className="mr-auto text-ui-label text-ui-warning">Unsaved changes</p>
          ) : null}
          <Button type="submit" variant="primary" pending={pending} disabled={!dirty}>
            {pending ? "Saving…" : `Save ${title.toLowerCase()}`}
          </Button>
        </div>
      </form>
      <ConfirmDialog
        open={asking}
        onClose={() => setAsking(false)}
        onConfirm={() => {
          setAsking(false);
          setConfirmEmpty("yes");
          // Set the field directly too, so this submit carries it before React re-renders.
          if (confirmInput.current) confirmInput.current.value = "yes";
          form.current?.requestSubmit();
        }}
        title="Clear every slot?"
        description={`The ${title.toLowerCase()} section will be hidden.`}
        confirmLabel="Clear slots"
      />
      <SaveToast state={state} />
    </Card>
  );
}
