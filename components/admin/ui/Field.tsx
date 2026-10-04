"use client";

import { type ComponentProps, createContext, type ReactNode, useContext, useId } from "react";
import { cx } from "./cx";

type FieldContext = { id: string; describedBy?: string; invalid: boolean };
const Ctx = createContext<FieldContext | null>(null);

/**
 * Label, control, hint and error (spec 11 §4). Controls inside pick up the id, aria-describedby and aria-invalid.
 * Pass `error` straight from `ActionState.fieldErrors?.[name]`.
 */
export function Field({ label, hint, error, optional, className, children }: { label: ReactNode; hint?: ReactNode; error?: string; optional?: boolean; className?: string; children: ReactNode }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-ui-label font-medium text-ui-text">
        {label}
        {optional ? <span className="ml-1 font-normal text-ui-text-3">(optional)</span> : null}
      </label>
      <Ctx.Provider value={{ id, describedBy, invalid: Boolean(error) }}>{children}</Ctx.Provider>
      {hint ? (
        <p id={hintId} className="text-ui-hint text-ui-text-3">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-ui-hint font-medium text-ui-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function useFieldProps<T extends { id?: string; "aria-describedby"?: string; "aria-invalid"?: ComponentProps<"input">["aria-invalid"] }>(props: T): T {
  const field = useContext(Ctx);
  if (!field) return props;
  return { ...props, id: props.id ?? field.id, "aria-describedby": props["aria-describedby"] ?? field.describedBy, "aria-invalid": props["aria-invalid"] ?? (field.invalid || undefined) };
}

export const controlClasses =
  "w-full rounded-ui-md border border-ui-border bg-ui-surface px-3 text-ui-base text-ui-text shadow-ui-card transition-colors duration-150 placeholder:text-ui-text-3 hover:border-ui-border-strong disabled:cursor-not-allowed disabled:bg-ui-subtle disabled:text-ui-text-3 aria-invalid:border-ui-danger";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...useFieldProps(props)} className={cx(controlClasses, "h-9", className)} />;
}

/** Event times are Eastern ISO strings (spec 06 §5); pair with a Field hint that says "Eastern time". */
export function DateTimeInput(props: Omit<ComponentProps<"input">, "type">) {
  return <Input type="datetime-local" {...props} />;
}

export function Textarea({ className, rows = 4, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={rows} {...useFieldProps(props)} className={cx(controlClasses, "py-2", className)} />;
}

const CHEVRON = "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')]";

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select {...useFieldProps(props)} className={cx(controlClasses, "h-9 appearance-none bg-[length:16px] bg-[right_0.625rem_center] bg-no-repeat pr-9", CHEVRON, className)}>
      {children}
    </select>
  );
}

/** A checkbox with its label to the right; for picking from a list. Single on/off settings use Switch. */
export function Checkbox({ label, hint, className, ...props }: { label: ReactNode; hint?: ReactNode } & Omit<ComponentProps<"input">, "type">) {
  const id = useId();
  return (
    <div className={cx("flex items-start gap-2.5", className)}>
      <input id={id} type="checkbox" {...props} className="mt-0.5 size-4 shrink-0 accent-ui-accent" />
      <label htmlFor={id} className="text-ui-base text-ui-text">
        {label}
        {hint ? <span className="block text-ui-hint text-ui-text-3">{hint}</span> : null}
      </label>
    </div>
  );
}
