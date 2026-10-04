"use client";

import { LogOut } from "lucide-react";
import { useSyncExternalStore } from "react";

export const SIGN_OUT_PATH = "/account/sign-out";

/** Cookies don't notify, and the page reloads on sign-in and sign-out, so there is nothing to subscribe to. */
const subscribe = () => () => {};

/**
 * Clerk's `__client_uat` cookie (suffixed per instance in development) holds when the client last changed, or 0
 * when signed out. Clerk reads it itself to decide whether to look for a session, and unlike the session token it
 * doesn't expire after a minute.
 */
function hasSignedInCookie(): boolean {
  return document.cookie.split(";").some((part) => {
    const at = part.indexOf("=");
    if (at === -1) return false;
    const name = part.slice(0, at).trim();
    const value = part.slice(at + 1).trim();
    return (name === "__client_uat" || name.startsWith("__client_uat_")) && value !== "" && value !== "0";
  });
}

/**
 * Circular sign-out, fixed in the bottom-left corner of every public page for signed-in visitors, the mirror of the
 * portal button. Public pages run no Clerk JS (spec 06 §4), so this reads Clerk's cookie after mount (the static
 * HTML never contains it) and links to /account/sign-out, which loads Clerk and ends the session. A plain <a>, as with
 * the portal button, so the next page is a full load.
 */
export function SignOutButton() {
  const signedIn = useSyncExternalStore(subscribe, hasSignedInCookie, () => false);
  if (!signedIn) return null;
  return (
    <a
      href={SIGN_OUT_PATH}
      rel="nofollow"
      aria-label="Sign out"
      title="Sign out"
      className="fixed bottom-4 left-4 z-40 flex size-11 items-center justify-center rounded-full border border-rule bg-bone text-ink-2 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.25)] transition-colors duration-150 hover:text-navy focus-visible:text-navy print:hidden md:bottom-6 md:left-6"
    >
      <LogOut aria-hidden="true" className="size-5" strokeWidth={1.5} />
    </a>
  );
}
