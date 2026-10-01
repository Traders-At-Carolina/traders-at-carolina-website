import type { ComponentPropsWithoutRef, ElementType } from "react";

type ContainerProps<T extends ElementType> = { as?: T } & ComponentPropsWithoutRef<T>;

/** Page-width wrapper: 1200px content with 20 / 32 / 48px side padding (00 §6). */
export function Container<T extends ElementType = "div">({ as, className = "", ...props }: ContainerProps<T>) {
  const Tag = as ?? "div";
  return <Tag className={`mx-auto w-full max-w-page px-5 md:px-8 lg:px-12 ${className}`} {...props} />;
}

/** 12-column grid with 16px (mobile) / 24px gutters. */
export function Grid<T extends ElementType = "div">({ as, className = "", ...props }: ContainerProps<T>) {
  const Tag = as ?? "div";
  return <Tag className={`grid grid-cols-12 gap-x-4 md:gap-x-6 ${className}`} {...props} />;
}
