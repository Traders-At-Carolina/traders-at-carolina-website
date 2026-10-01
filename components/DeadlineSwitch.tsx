"use client";

import { useEffect, useState, type ReactNode } from "react";

type DeadlineSwitchProps = {
  /** Deadline as an ISO instant (UTC). */
  deadline: string;
  /** Rendered at build time and until the deadline passes. */
  before: ReactNode;
  /** Rendered once the visitor's clock passes the deadline (spec 05 §3). */
  after: ReactNode;
};

// setTimeout overflows above ~24.8 days; re-check at that interval for longer waits.
const MAX_DELAY = 2_147_483_647;

/**
 * Re-evaluates the open → closed transition in the browser, so a static page built before the
 * deadline still switches once it passes. Renders `before` on the server and first paint, so there's no flash.
 */
export function DeadlineSwitch({ deadline, before, after }: DeadlineSwitchProps) {
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    const at = Date.parse(deadline);
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const wait = at - Date.now();
      timer = setTimeout(() => (Date.now() >= at ? setPassed(true) : schedule()), Math.min(Math.max(wait, 0), MAX_DELAY));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [deadline]);

  return <>{passed ? after : before}</>;
}
