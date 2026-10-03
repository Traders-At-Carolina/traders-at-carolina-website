"use client";

import { LogIn } from "lucide-react";
import { usePathname } from "next/navigation";

export const PORTAL_PATH = "/portal";

/**
 * Circular way into the portal, fixed in the bottom-right corner of every public page (spec 09 §2). Signed-out
 * visitors are sent on to sign-in and back. A plain <a>, not next/link: public pages run no Clerk JS, so the session
 * token goes stale after about a minute, and only a full page load lets Clerk refresh it. Hidden on the portal itself.
 */
export function PortalButton() {
  const pathname = usePathname();
  if (pathname === PORTAL_PATH || pathname.startsWith(`${PORTAL_PATH}/`)) return null;
  return (
    <a
      href={PORTAL_PATH}
      rel="nofollow"
      aria-label="Member portal"
      title="Member portal"
      className="fixed right-4 bottom-4 z-40 flex size-11 items-center justify-center rounded-full border border-rule bg-bone text-ink-2 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.25)] transition-colors duration-150 hover:text-navy focus-visible:text-navy print:hidden md:right-6 md:bottom-6"
    >
      <LogIn aria-hidden="true" className="size-5" strokeWidth={1.5} />
    </a>
  );
}
