"use client";

import { track } from "@vercel/analytics";
import { useEffect } from "react";
import { clickLocation, conversionEvent } from "@/lib/track";

type ClickTrackerProps = { applyUrl: string; interestFormUrl?: string };

/**
 * One delegated listener that reports Apply and "Get notified" clicks to Vercel Web Analytics with the
 * page and the spot they came from, so buttons stay server components. Custom events need a Vercel Pro plan.
 */
export function ClickTracker({ applyUrl, interestFormUrl }: ClickTrackerProps) {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link) return;
      const name = conversionEvent(link.getAttribute("href") ?? "", { applyUrl, interestFormUrl });
      if (name) track(name, { location: clickLocation(link), page: window.location.pathname });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [applyUrl, interestFormUrl]);

  return null;
}
