"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type FooterZoneProps = {
  /** Exact paths, e.g. "/apply", where this part of the footer is not rendered. */
  hideOn: string[];
  children: ReactNode;
};

const withoutTrailingSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);

/**
 * Hides part of the footer on specific routes (spec 07 §2). The footer is a server component in the root layout and
 * cannot read the route itself; its server-rendered children pass through here untouched.
 */
export function FooterZone({ hideOn, children }: FooterZoneProps) {
  const pathname = withoutTrailingSlash(usePathname());
  return hideOn.includes(pathname) ? null : <>{children}</>;
}
