"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useActionState, useRef, useState } from "react";
import { SaveToast } from "@/components/admin/SaveToast";
import type { ActionState } from "@/lib/admin/action";
import { useSaveForm } from "@/lib/admin/use-save-form";
import { Button, buttonClasses } from "./Button";
import { ConfirmDialog } from "./Dialog";
import { Banner } from "./Feedback";
import { cx } from "./cx";

type Action = (p: ActionState, f: FormData) => Promise<ActionState>;

/**
 * The save bar at the foot of every editor card (spec 11 §6): the form-level error, an "Unsaved changes" note, Cancel
 * and Save. It sticks to the bottom of the viewport while the form is longer than the screen.
 */
export function FormFooter({ pending, dirty = false, submitLabel = "Save", cancelHref, error, children }: { pending: boolean; dirty?: boolean; submitLabel?: string; cancelHref?: string; error?: string; children?: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 rounded-b-ui-lg border-t border-ui-border bg-ui-surface/95 px-5 py-3 backdrop-blur">
      {error ? (
        <p role="alert" className="mb-3 text-ui-base font-medium text-ui-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {dirty && !pending ? <p className="mr-auto text-ui-label text-ui-warning">Unsaved changes</p> : null}
        {children}
        {cancelHref ? (
          <Link href={cancelHref} className={buttonClasses({ variant: "ghost" })}>
            Cancel
          </Link>
        ) : null}
        <Button type="submit" variant="primary" pending={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}

/** A form-level error outside a FormFooter. */
export function FormError({ state }: { state: ActionState }) {
  return state.error ? (
    <p role="alert" className="text-ui-base font-medium text-ui-danger">
      {state.error}
    </p>
  ) : null;
}

/**
 * The delete card on edit pages: a button that asks first, saying what else changes (spec 06 §6.0), then submits.
 * The save toast offers Undo right after.
 */
export function DeleteButton({ action, confirm: question, label }: { action: () => Promise<ActionState>; confirm: string; label: string }) {
  const { state, formAction, pending } = useSaveForm(action as unknown as Action);
  const [open, setOpen] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const [seenAt, setSeenAt] = useState(state.at);
  if (state.at !== seenAt) {
    setSeenAt(state.at);
    setOpen(false);
  }
  return (
    <form ref={form} action={formAction} className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-ui-lg border border-ui-danger/25 bg-ui-surface px-5 py-4 shadow-ui-card">
      <div>
        <p className="text-ui-base font-medium text-ui-text">{label}</p>
        <p className="mt-0.5 text-ui-label text-ui-text-2">You can undo this right after.</p>
        {state.error ? <p className="mt-1 text-ui-label font-medium text-ui-danger">{state.error}</p> : null}
      </div>
      <Button variant="secondary" icon={Trash2} onClick={() => setOpen(true)} className="text-ui-danger">
        {label}
      </Button>
      <ConfirmDialog open={open} onClose={() => setOpen(false)} onConfirm={() => form.current?.requestSubmit()} pending={pending} title={`${label}?`} description={question} confirmLabel={label} />
      <SaveToast state={state} />
    </form>
  );
}

/** Up/down reorder buttons that work by keyboard (spec 06 §6.0). */
export function MoveButtons({ action, fields, name, first, last }: { action: Action; fields: Record<string, string>; name: string; first: boolean; last: boolean }) {
  const [state, formAction, pending] = useActionState(action, {});
  const btn = "inline-flex size-8 items-center justify-center rounded-ui-md text-ui-text-2 transition-colors hover:bg-ui-subtle hover:text-ui-text disabled:pointer-events-none disabled:opacity-30";
  return (
    <form action={formAction} className="flex items-center">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" name="dir" value="up" disabled={first || pending} aria-label={`Move ${name} up`} className={btn}>
        <ChevronUp aria-hidden className="size-4" />
      </button>
      <button type="submit" name="dir" value="down" disabled={last || pending} aria-label={`Move ${name} down`} className={btn}>
        <ChevronDown aria-hidden className="size-4" />
      </button>
      <SaveToast state={state} />
    </form>
  );
}

/** A preview panel beside a form (PersonCard, SponsorMark, cropped photo). */
export function PreviewPanel({ children, note, className }: { children: ReactNode; note?: ReactNode; className?: string }) {
  return (
    <aside aria-label="Preview" className={cx("flex flex-col gap-3", className)}>
      <p className="text-ui-label font-medium text-ui-text-2">Preview</p>
      <div className="overflow-hidden rounded-ui-lg border border-ui-border">{children}</div>
      {note ? <Banner tone="warning">{note}</Banner> : null}
    </aside>
  );
}
