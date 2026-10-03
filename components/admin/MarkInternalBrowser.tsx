"use client";

import { useEffect } from "react";
import { INTERNAL_FLAG } from "@/lib/analytics/client-config";

/** Marks this browser as an admin's, so public-page analytics skip it from now on (spec 06 §7.1). */
export function MarkInternalBrowser() {
  useEffect(() => {
    try {
      window.localStorage.setItem(INTERNAL_FLAG, "1");
    } catch {
      // Storage blocked: analytics may count this browser, which is harmless.
    }
  }, []);
  return null;
}
