"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

/** Ends the Clerk session as soon as it mounts, then sends the visitor to the home page. */
export function SignOutNow() {
  const { signOut } = useClerk();
  useEffect(() => {
    void signOut({ redirectUrl: "/" });
  }, [signOut]);
  return (
    <p role="status" className="text-body text-ink-3">
      Signing you out…
    </p>
  );
}
