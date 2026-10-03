import { describe, expect, it } from "vitest";
import { ctaFromLabel, trackAttrs } from "@/lib/analytics/attributes";
import { INTERNAL_FLAG, isAdminPath, isPrivatePath, posthogConfig, readTrackContext, shouldTrack, uiHostFor } from "@/lib/analytics/client-config";
import { posthogRewrites } from "@/lib/analytics/proxy";

describe("trackAttrs", () => {
  it("emits nothing without a track", () => {
    expect(trackAttrs()).toEqual({});
  });

  it("emits PostHog capture attributes for each field that is set", () => {
    expect(trackAttrs({ cta: "apply", placement: "header" })).toEqual({
      "data-ph-capture-attribute-cta": "apply",
      "data-ph-capture-attribute-placement": "header",
    });
    expect(trackAttrs({ cta: "sponsor", target: "Jane Street" })).toEqual({
      "data-ph-capture-attribute-cta": "sponsor",
      "data-ph-capture-attribute-target": "Jane Street",
    });
  });
});

describe("ctaFromLabel", () => {
  it("turns a button label into a stable slug", () => {
    expect(ctaFromLabel("Apply")).toBe("apply");
    expect(ctaFromLabel("Get notified")).toBe("get-notified");
    expect(ctaFromLabel(" How to apply → ")).toBe("how-to-apply");
  });
});

describe("shouldTrack", () => {
  const visitor = { pathname: "/team", internal: false, doNotTrack: false, globalPrivacyControl: false };

  it("tracks an ordinary visitor on a public page", () => {
    expect(shouldTrack(visitor)).toBe(true);
  });

  it("never tracks /admin, admins' browsers, Do Not Track or Global Privacy Control", () => {
    expect(shouldTrack({ ...visitor, pathname: "/admin" })).toBe(false);
    expect(shouldTrack({ ...visitor, pathname: "/admin/photos" })).toBe(false);
    expect(shouldTrack({ ...visitor, internal: true })).toBe(false);
    expect(shouldTrack({ ...visitor, doNotTrack: true })).toBe(false);
    expect(shouldTrack({ ...visitor, globalPrivacyControl: true })).toBe(false);
  });

  it("only treats the /admin segment as admin", () => {
    expect(isAdminPath("/administrators")).toBe(false);
  });

  it("never tracks the portal or account pages, so member links stay on the site (spec 06 §7.1)", () => {
    expect(shouldTrack({ ...visitor, pathname: "/portal" })).toBe(false);
    expect(shouldTrack({ ...visitor, pathname: "/portal/competitions" })).toBe(false);
    expect(shouldTrack({ ...visitor, pathname: "/account/sign-in" })).toBe(false);
    expect(isPrivatePath("/portals")).toBe(false);
    expect(isPrivatePath("/accounting")).toBe(false);
  });
});

describe("readTrackContext", () => {
  it("reads the path, the internal flag and privacy signals from the browser", () => {
    localStorage.setItem(INTERNAL_FLAG, "1");
    expect(readTrackContext(window)).toEqual({
      pathname: "/",
      internal: true,
      doNotTrack: false,
      globalPrivacyControl: false,
    });
    localStorage.removeItem(INTERNAL_FLAG);
    expect(readTrackContext(window).internal).toBe(false);
  });
});

describe("posthogConfig", () => {
  const config = posthogConfig("https://us.i.posthog.com", () => false);

  it("sends through the same-origin proxy and keeps visitors anonymous", () => {
    expect(config).toMatchObject({
      api_host: "/rp",
      ui_host: "https://us.posthog.com",
      capture_pageview: "history_change",
      capture_pageleave: true,
      persistence: "localStorage",
      person_profiles: "identified_only",
      disable_session_recording: true,
      disable_surveys: true,
      respect_dnt: true,
    });
  });

  it("drops events from /admin and from admins' browsers", () => {
    const event = (pathname: string) => ({ event: "$pageview", properties: { $pathname: pathname } });
    const send = config.before_send as (e: unknown) => unknown;
    expect(send(event("/team"))).toEqual(event("/team"));
    expect(send(event("/admin/photos"))).toBeNull();
    expect(send(event("/portal"))).toBeNull();
    const internalSend = posthogConfig("https://us.i.posthog.com", () => true).before_send as (e: unknown) => unknown;
    expect(internalSend(event("/team"))).toBeNull();
  });

  it("points the PostHog UI at the same region as ingestion", () => {
    expect(uiHostFor("https://us.i.posthog.com")).toBe("https://us.posthog.com");
    expect(uiHostFor("https://eu.i.posthog.com")).toBe("https://eu.posthog.com");
  });
});

describe("posthogRewrites", () => {
  it("proxies assets before the catch-all, for the configured region", () => {
    expect(posthogRewrites("https://eu.i.posthog.com")).toEqual([
      { source: "/rp/static/:path*", destination: "https://eu-assets.i.posthog.com/static/:path*" },
      { source: "/rp/array/:path*", destination: "https://eu-assets.i.posthog.com/array/:path*" },
      { source: "/rp/:path*", destination: "https://eu.i.posthog.com/:path*" },
    ]);
  });
});
