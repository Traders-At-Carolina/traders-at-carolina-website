import { describe, expect, it, vi } from "vitest";
import type { ClubEvent } from "@/content/types";

const sample: ClubEvent[] = [
  { title: "Members social", type: "social", startsAt: "2027-01-12T19:00", audience: "members", featured: false },
  { title: "Info session", type: "recruiting", startsAt: "2027-01-10T19:00", audience: "public", featured: true },
  { title: "Officer-only recruiting sync", type: "recruiting", startsAt: "2027-01-11T19:00", audience: "members", featured: false },
  { title: "Citadel challenge", type: "competition", startsAt: "2027-01-20T18:00", audience: "signed_in", featured: false },
  { title: "Last term's kickoff", type: "general-meeting", startsAt: "2026-09-01T19:00", audience: "public", featured: false },
];
vi.mock("@/content/events", () => ({ events: sample }));

const { myRequest, portalAnnouncements, portalEvents, portalLinks, portalResources, portalSettings, recruitingTimeline } = await import("@/lib/data/portal");
const { audienceViewer, canSee } = await import("@/lib/members/audience");
const { getMembership } = await import("@/lib/members/resolve");
const { site } = await import("@/content/site");

const now = new Date("2027-01-05T17:00:00Z");

describe("canSee", () => {
  it("shows public and signed-in items to everyone in the portal, members-only items to members", () => {
    expect(canSee("public", "signed_in")).toBe(true);
    expect(canSee("signed_in", "signed_in")).toBe(true);
    expect(canSee("members", "signed_in")).toBe(false);
    expect(canSee("members", "member")).toBe(true);
  });

  it("maps the viewer's membership to an audience viewer", () => {
    expect(audienceViewer(true)).toBe("member");
    expect(audienceViewer(false)).toBe("signed_in");
  });
});

describe("getMembership (stub until spec 06 phase 4)", () => {
  it("finds nobody on the roster yet, so only admins see the member view", async () => {
    expect(await getMembership({ id: "user_1", verifiedEmails: ["ada@unc.edu"] })).toBeNull();
  });
});

describe("portalEvents", () => {
  it("returns upcoming events the viewer may see, soonest first", async () => {
    expect((await portalEvents("signed_in", now)).map((e) => e.title)).toEqual(["Info session", "Citadel challenge"]);
    expect((await portalEvents("member", now)).map((e) => e.title)).toEqual([
      "Info session",
      "Officer-only recruiting sync",
      "Members social",
      "Citadel challenge",
    ]);
  });
});

describe("recruitingTimeline", () => {
  it("returns the recruiting settings and the upcoming recruiting events anyone signed in may see", async () => {
    const timeline = await recruitingTimeline(now);
    expect(timeline.recruiting).toBe(site.recruiting);
    expect(timeline.events.map((e) => e.title)).toEqual(["Info session"]);
  });
});

describe("portalLinks", () => {
  const env = { INTERNSHIP_TRACKER_URL: " https://docs.google.com/spreadsheets/d/abc " };

  it("gives members the internship tracker from the environment until phase 7", async () => {
    expect(await portalLinks("member", env)).toEqual([
      expect.objectContaining({ id: "internship-tracker", label: "Internship tracker", url: "https://docs.google.com/spreadsheets/d/abc" }),
    ]);
  });

  it("never gives it to anyone else, and ignores a missing or non-https link", async () => {
    expect(await portalLinks("signed_in", env)).toEqual([]);
    expect(await portalLinks("member", {})).toEqual([]);
    expect(await portalLinks("member", { INTERNSHIP_TRACKER_URL: "http://example.com" })).toEqual([]);
  });
});

describe("the rest, empty until spec 06 phases 4 and 7", () => {
  it("has no resources, announcements or requests, and keeps requests off", async () => {
    expect(await portalResources("member")).toEqual({ learning: [], "interview-prep": [], recruiting: [], other: [] });
    expect(await portalAnnouncements("member")).toEqual([]);
    expect(await myRequest("user_1")).toBeNull();
    expect(await portalSettings()).toEqual({ acceptRequests: false });
  });
});
