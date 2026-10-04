"use client";

import { X } from "lucide-react";
import { type ReactNode, type RefObject, useEffect, useId, useRef } from "react";
import { Button } from "./Button";
import { cx } from "./cx";

/** Opens or closes a <dialog> as a modal to match `open`; falls back to the attribute where showModal is missing. */
export function useModal(ref: RefObject<HTMLDialogElement | null>, open: boolean) {
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [ref, open]);
}

/**
 * A modal on native <dialog> (spec 11 §4): the browser traps focus, Esc closes, and focus returns to the opener.
 * Controlled by `open`; `onClose` fires on Esc, the close button and a backdrop click.
 */
export function Dialog({ open, onClose, title, description, footer, size = "md", className, children }: { open: boolean; onClose: () => void; title: ReactNode; description?: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg"; className?: string; children?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();
  useModal(ref, open);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cx(
        "m-auto w-[calc(100%-2rem)] animate-ui-pop rounded-ui-lg border border-ui-border bg-ui-surface p-0 text-ui-text shadow-ui-pop backdrop:bg-ui-text/40",
        { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" }[size],
        className,
      )}
    >
      {open ? (
        <div className="font-ui">
          <div className="flex items-start justify-between gap-4 px-6 pt-5">
            <div>
              <h2 id={titleId} className="text-ui-section font-semibold">
                {title}
              </h2>
              {description ? (
                <p id={descId} className="mt-1 text-ui-base text-ui-text-2">
                  {description}
                </p>
              ) : null}
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="-mt-1 -mr-1 inline-flex size-8 items-center justify-center rounded-ui-full text-ui-text-3 hover:bg-ui-subtle hover:text-ui-text">
              <X aria-hidden className="size-4" />
            </button>
          </div>
          {children ? <div className="px-6 pt-4">{children}</div> : null}
          <div className="mt-5 flex flex-wrap justify-end gap-2 rounded-b-ui-lg border-t border-ui-border bg-ui-canvas px-6 py-3">{footer}</div>
        </div>
      ) : null}
    </dialog>
  );
}

/**
 * "Delete X?" with what else changes (spec 06 §6.0). `onConfirm` usually submits a form; keep the dialog open while
 * `pending` so the button shows progress.
 */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Delete", pending = false, tone = "danger" }: { open: boolean; onClose: () => void; onConfirm: () => void; title: ReactNode; description?: ReactNode; confirmLabel?: string; pending?: boolean; tone?: "danger" | "primary" }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} pending={pending}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
