import type { PostHogConfig } from "posthog-js";

/** Same-origin path that next.config.ts rewrites to PostHog, so ad blockers don't drop events. */
export const INGEST_PATH = "/rp";

/** Set in localStorage by /admin (spec 06 §7.1); that browser is never tracked again. */
export const INTERNAL_FLAG = "tac:internal";

export type TrackContext = { pathname: string; internal: boolean; doNotTrack: boolean; globalPrivacyControl: boolean };

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/** Visitors only: never /admin, never a browser that has signed in to /admin, never with DNT or GPC on. */
export function shouldTrack(ctx: TrackContext): boolean {
  return !isAdminPath(ctx.pathname) && !ctx.internal && !ctx.doNotTrack && !ctx.globalPrivacyControl;
}

function isInternalBrowser(win: Window): boolean {
  try {
    return win.localStorage.getItem(INTERNAL_FLAG) === "1";
  } catch {
    // Storage can be blocked (private mode, site settings); treat as an ordinary visitor.
    return false;
  }
}

export function readTrackContext(win: Window): TrackContext {
  const nav = win.navigator as Navigator & { globalPrivacyControl?: boolean };
  return {
    pathname: win.location.pathname,
    internal: isInternalBrowser(win),
    doNotTrack: nav.doNotTrack === "1",
    globalPrivacyControl: nav.globalPrivacyControl === true,
  };
}

/** "https://eu.i.posthog.com" → "https://eu.posthog.com": the app host for the same region. */
export function uiHostFor(ingestHost: string): string {
  return ingestHost.includes("://eu.") ? "https://eu.posthog.com" : "https://us.posthog.com";
}

type CaptureEvent = { properties?: { $pathname?: string } } | null;

/** Anonymous, cookieless capture: pageviews, page-leave (time on page) and link/button clicks only. */
export function posthogConfig(ingestHost: string, isInternal: () => boolean): Partial<PostHogConfig> {
  return {
    api_host: INGEST_PATH,
    ui_host: uiHostFor(ingestHost),
    capture_pageview: "history_change",
    capture_pageleave: true,
    autocapture: { element_allowlist: ["a", "button"] },
    enable_heatmaps: true,
    disable_session_recording: true,
    disable_surveys: true,
    person_profiles: "identified_only",
    persistence: "localStorage",
    respect_dnt: true,
    before_send: ((event: CaptureEvent) => {
      if (!event) return null;
      if (isAdminPath(event.properties?.$pathname ?? "") || isInternal()) return null;
      return event;
    }) as PostHogConfig["before_send"],
  };
}
