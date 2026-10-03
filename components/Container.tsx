import { createElement, type ComponentPropsWithoutRef } from "react";

/** HTML tags only. createElement avoids a JSX element typed over every intrinsic tag (SVG included). */
type Tag = keyof HTMLElementTagNameMap;
type ContainerProps<T extends Tag> = { as?: T } & ComponentPropsWithoutRef<T>;

/** Page-width wrapper: 1200px content with 20 / 32 / 48px side padding (00 §6). */
export function Container<T extends Tag = "div">({ as, className = "", ...props }: ContainerProps<T>) {
  return createElement(as ?? "div", { ...props, className: `mx-auto w-full max-w-page px-5 md:px-8 lg:px-12 ${className}` });
}

/** 12-column grid with 16px (mobile) / 24px gutters. */
export function Grid<T extends Tag = "div">({ as, className = "", ...props }: ContainerProps<T>) {
  return createElement(as ?? "div", { ...props, className: `grid grid-cols-12 gap-x-4 md:gap-x-6 ${className}` });
}
