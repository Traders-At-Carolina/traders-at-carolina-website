"use client";

import { Ellipsis } from "lucide-react";
import Link from "next/link";
import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { cx } from "./cx";

export type MenuItem = { label: string; href?: string; onSelect?: () => void; danger?: boolean; disabled?: boolean };

/**
 * A row-actions dropdown (spec 11 §4): arrows, Home/End, Esc and type-ahead. Items are links or callbacks; anything that
 * writes should open a ConfirmDialog or submit a form from its callback.
 */
export function Menu({ label, items, trigger, align = "end" }: { label: string; items: MenuItem[]; trigger?: ReactNode; align?: "start" | "end" }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const enabled = items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0);
  const focusItem = (i: number | undefined) => {
    if (i !== undefined) itemRefs.current[i]?.focus();
  };

  useEffect(() => {
    if (!open) return;
    focusItem(enabled[0]);
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focus the first item once, when the menu opens
  }, [open]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const current = itemRefs.current.findIndex((el) => el === document.activeElement);
    const pos = enabled.indexOf(current);
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusItem(enabled[(pos + 1) % enabled.length]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusItem(enabled[(pos - 1 + enabled.length) % enabled.length]);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusItem(enabled[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      focusItem(enabled[enabled.length - 1]);
    } else if (e.key === "Tab") {
      setOpen(false);
    } else if (e.key.length === 1) {
      focusItem(enabled.find((i) => items[i].label.toLowerCase().startsWith(e.key.toLowerCase())));
    }
  };

  const itemClass = (item: MenuItem) =>
    cx(
      "flex w-full items-center rounded-ui-sm px-2.5 py-2 text-left text-ui-base outline-none focus-visible:outline-none aria-disabled:opacity-50",
      item.danger ? "text-ui-danger hover:bg-ui-danger-soft focus:bg-ui-danger-soft" : "text-ui-text hover:bg-ui-subtle focus:bg-ui-subtle",
    );

  return (
    <div ref={root} className="relative inline-block" onKeyDown={open ? onKeyDown : undefined}>
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={trigger ? undefined : label}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="inline-flex size-8 items-center justify-center rounded-ui-full text-ui-text-2 transition-colors hover:bg-ui-subtle hover:text-ui-text"
      >
        {trigger ?? <Ellipsis aria-hidden className="size-4" />}
      </button>
      {open ? (
        <div id={id} role="menu" aria-label={label} className={cx("absolute top-full z-40 mt-1 min-w-44 animate-ui-pop rounded-ui-md border border-ui-border bg-ui-surface p-1 shadow-ui-pop", align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left")}>
          {items.map((item, i) =>
            item.href && !item.disabled ? (
              <Link
                key={item.label}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                href={item.href}
                role="menuitem"
                tabIndex={-1}
                className={itemClass(item)}
                onClick={() => close(false)}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                aria-disabled={item.disabled || undefined}
                className={itemClass(item)}
                onClick={() => {
                  if (item.disabled) return;
                  close();
                  item.onSelect?.();
                }}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
