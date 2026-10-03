import { describe, expect, it } from "vitest";
import { portal } from "@/content/portal";
import type { ClubEvent } from "@/content/types";
import { numberSections } from "@/lib/home";
import { portalApplyAction, portalSections, upcomingForViewer } from "@/lib/portal";
import { collectPortalProblems, validatePortal } from "@/lib/validate-portal";

describe("portalSections", () => {
  it("puts recruiting and prep first for people who aren't members yet", () => {
    const keys = portalSections({ isMember: false });
    expect(keys).toEqual(["recruiting", "prep", "events", "tracks", "club"]);
    expect(numberSections(keys)).toEqual({ recruiting: 1, prep: 2, events: 3, tracks: 4, club: 5 });
  });

  it("puts members' own resources first and drops the recruiting timeline", () => {
    expect(portalSections({ isMember: true })).toEqual(["learning", "tools", "events", "prep", "tracks", "club"]);
  });

  it("never shows member sections to anyone else", () => {
    expect(portalSections({ isMember: false })).not.toContain("learning");
    expect(portalSections({ isMember: false })).not.toContain("tools");
  });
});

describe("upcomingForViewer", () => {
  const event = (title: string, type: ClubEvent["type"]): ClubEvent => ({ title, type, startsAt: "2027-01-14T19:00", audience: "public", featured: false });
  const events = [event("Info session", "recruiting"), event("Citadel challenge", "competition")];

  it("leaves recruiting events to the timeline for non-members, and gives them to members", () => {
    expect(upcomingForViewer(events, { isMember: false }).map((e) => e.title)).toEqual(["Citadel challenge"]);
    expect(upcomingForViewer(events, { isMember: true })).toHaveLength(2);
  });
});

describe("portalApplyAction", () => {
  it("points /apply's on-page anchors back at /apply, and leaves real links alone", () => {
    expect(portalApplyAction({ label: "Read the FAQ", href: "#faq", external: false })).toEqual({ label: "Read the FAQ", href: "/apply#faq", external: false });
    const form = { label: "Keep me posted", href: "https://forms.gle/x", external: true };
    expect(portalApplyAction(form)).toBe(form);
  });
});

describe("validatePortal", () => {
  it("accepts the shipped content", () => {
    expect(() => validatePortal(portal)).not.toThrow();
  });

  it("rejects any link that isn't internal, since the repository is public", () => {
    const leaked = { ...portal, clubLinks: [{ label: "Tracker", href: "https://docs.google.com/spreadsheets/d/secret" }] };
    expect(collectPortalProblems(leaked)).toEqual([`clubLinks[0] must be an internal link ("/…" or "#…"), got "https://docs.google.com/spreadsheets/d/secret"`]);
    const protocolRelative = {
      ...portal,
      interviewPrep: { ...portal.interviewPrep, prepare: [...portal.interviewPrep.prepare.slice(0, 1), { text: "Read this.", link: { label: "x", href: "//evil.example" } }] },
    };
    expect(collectPortalProblems(protocolRelative)).toEqual([`interviewPrep.prepare[1].link must be an internal link ("/…" or "#…"), got "//evil.example"`]);
  });

  it("rejects blank copy and lists outside their sizes, all at once", () => {
    const bad = {
      ...portal,
      header: { ...portal.header, memberLead: " " },
      requestAccess: { ...portal.requestAccess, pending: "" },
      interviewPrep: { ...portal.interviewPrep, lookFor: ["Only one"] },
      clubLinks: [],
    };
    expect(collectPortalProblems(bad)).toEqual([
      "header.memberLead must not be empty",
      "requestAccess.pending must not be empty",
      "interviewPrep.lookFor must have 2–5 entries (got 1)",
      "clubLinks must have 1–4 entries (got 0)",
    ]);
    expect(() => validatePortal(bad)).toThrow(/content\/portal\.ts/);
  });
});
