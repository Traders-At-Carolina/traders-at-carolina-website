import type { ComponentProps } from "react";
import { cx } from "./cx";

/**
 * Table primitives for the console (spec 11 §4). Wrap in a Card; the frame scrolls sideways on narrow screens. Phase B
 * adds the DataTable conveniences (selection bar, row menus, card fallback) on top of these.
 */
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto">
      <table className={cx("w-full border-collapse text-left text-ui-base", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cx("bg-ui-subtle text-ui-label text-ui-text-2", className)} {...props} />;
}

export function TBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={cx("divide-y divide-ui-border", className)} {...props} />;
}

export function TR({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cx("transition-colors duration-150 [tbody>&]:hover:bg-ui-canvas", className)} {...props} />;
}

export function TH({ className, ...props }: ComponentProps<"th">) {
  return <th scope="col" className={cx("h-10 border-b border-ui-border px-4 font-medium whitespace-nowrap first:pl-5 last:pr-5", className)} {...props} />;
}

export function TD({ className, ...props }: ComponentProps<"td">) {
  return <td className={cx("px-4 py-3 align-middle text-ui-text first:pl-5 last:pr-5", className)} {...props} />;
}
