"use client";

import { type ReactNode, useId, useState } from "react";
import { cx } from "./cx";

/**
 * An on/off setting (spec 11 §4). Posts `name=on` when on and nothing when off, exactly like a checkbox, so the
 * `checkbox` schema in lib/admin/schemas.ts reads it unchanged.
 */
export function Switch({
  name,
  label,
  hint,
  defaultChecked = false,
  checked: controlled,
  onCheckedChange,
  disabled,
  className,
}: {
  name?: string;
  label: ReactNode;
  hint?: ReactNode;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const [uncontrolled, setUncontrolled] = useState(defaultChecked);
  const checked = controlled ?? uncontrolled;
  const toggle = () => {
    const next = !checked;
    if (controlled === undefined) setUncontrolled(next);
    onCheckedChange?.(next);
  };
  return (
    <div className={cx("flex items-start justify-between gap-4", className)}>
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className={cx("text-ui-base font-medium", disabled ? "text-ui-text-3" : "text-ui-text")}>
          {label}
        </label>
        {hint ? (
          <p id={`${id}-hint`} className="text-ui-hint text-ui-text-3">
            {hint}
          </p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        disabled={disabled}
        onClick={toggle}
        className={cx(
          "relative inline-flex h-6 w-10 shrink-0 items-center rounded-ui-full p-0.5 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
          "before:absolute before:-inset-2.5 before:content-['']",
          checked ? "bg-ui-accent" : "bg-ui-border-strong",
        )}
      >
        <span aria-hidden className={cx("size-5 rounded-ui-full bg-white shadow-ui-card transition-transform duration-150", checked && "translate-x-4")} />
      </button>
      {name && checked && !disabled ? <input type="hidden" name={name} value="on" /> : null}
    </div>
  );
}
