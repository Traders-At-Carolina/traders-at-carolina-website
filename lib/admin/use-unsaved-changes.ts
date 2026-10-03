"use client";

import { useEffect } from "react";

const QUESTION = "You have unsaved changes. Leave without saving?";

/**
 * Asks before leaving a form with unsaved changes (spec 06 §6.0): on reload/close via beforeunload, and on in-app
 * links by intercepting clicks on <a> elements (the App Router has no navigation-blocking API).
 */
export function useUnsavedChanges(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!link || link.getAttribute("target") === "_blank" || event.defaultPrevented) return;
      if (!window.confirm(QUESTION)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}
