import { describe, expect, it } from "vitest";
import { apply } from "@/content/apply";
import type { Recruiting } from "@/content/types";
import { applyBandCopy, applyStatusCopy, formatDateRange, stageDates } from "@/lib/apply";
import { getApplicationState } from "@/lib/applications";
import { inlineToPlainText, parseInline } from "@/lib/inline-markdown";
import { validateApply } from "@/lib/validate-apply";

const now = new Date("2027-01-20T17:00:00Z");
const open: Recruiting = {
  applicationsOpen: true,
  applyUrl: "https://forms.gle/apply",
  cycleLabel: "Spring 2027",
  applyDeadline: "2027-02-06T23:59",
  interviewWindow: { start: "2027-02-10", end: "2027-02-14" },
  decisionDate: "2027-02-20",
  applicationMinutes: 20,
};
const closed: Recruiting = { applicationsOpen: false, applyUrl: "" };

describe("applyStatusCopy", () => {
  it("describes the open state with deadline and minutes", () => {
    const copy = applyStatusCopy(getApplicationState(now, open), open, undefined, now);
    expect(copy).toMatchObject({
      eyebrow: "Apply · Spring 2027",
      title: "Applications are open.",
      statusLine: "Due Sat, Feb 6 at 11:59 PM ET",
      lead: "The application takes about 20 minutes.",
      action: { label: "Apply", href: "https://forms.gle/apply", external: true },
      secondary: { href: "#process" },
    });
  });

  it("offers the interest form when closed", () => {
    const r = { ...closed, interestFormUrl: "https://forms.gle/notify", nextApplicationOpenDate: "2027-08-25" };
    const copy = applyStatusCopy(getApplicationState(now, r), r, "hi@club.org", now);
    expect(copy.statusLine).toBe("The next cycle opens Wed, Aug 25.");
    expect(copy.action).toEqual({ label: "Get notified", href: "https://forms.gle/notify", external: true });
    expect(copy.secondary.href).toBe("#faq");
  });

  it("falls back to email, then the FAQ, without an interest form", () => {
    expect(applyStatusCopy(getApplicationState(now, closed), closed, "hi@club.org", now).secondary).toEqual({
      label: "Email us",
      href: "mailto:hi@club.org",
    });
    const copy = applyStatusCopy(getApplicationState(now, closed), closed, undefined, now);
    expect(copy.action).toBeUndefined();
    expect(copy.statusLine).toBe("We recruit each fall and spring.");
    expect(copy.secondary.href).toBe("#faq");
  });
});

describe("applyBandCopy", () => {
  it("matches the state", () => {
    expect(applyBandCopy(getApplicationState(now, open), open, undefined)).toMatchObject({
      title: "Ready when you are.",
      lead: "Applications close Sat, Feb 6.",
    });
    expect(applyBandCopy(getApplicationState(now, closed), closed, undefined).action.label).toBe("Read the FAQ");
  });
});

describe("dates", () => {
  it("formats ranges", () => {
    expect(formatDateRange("2027-02-10", "2027-02-14")).toBe("Feb 10–14");
    expect(formatDateRange("2027-02-28", "2027-03-03")).toBe("Feb 28–Mar 3");
    expect(formatDateRange("2027-02-10", "2027-02-10")).toBe("Feb 10");
  });

  it("shows stage dates when open and nothing when closed", () => {
    expect(stageDates(getApplicationState(now, open), open)).toEqual(["Due Feb 6", "Feb 10–14", "By Feb 20"]);
    expect(stageDates(getApplicationState(now, closed), closed)).toEqual([undefined, undefined, undefined]);
  });
});

describe("inline markdown", () => {
  it("parses links and emphasis", () => {
    expect(parseInline("See [tracks](/membership) — *not* required.")).toEqual([
      { type: "text", value: "See " },
      { type: "link", text: "tracks", href: "/membership" },
      { type: "text", value: " — " },
      { type: "em", value: "not" },
      { type: "text", value: " required." },
    ]);
    expect(inlineToPlainText("See [tracks](/membership).")).toBe("See tracks.");
  });
});

describe("validateApply", () => {
  it("accepts the shipped content", () => {
    expect(() => validateApply(apply)).not.toThrow();
  });

  it("requires three stages, a FAQ and safe links", () => {
    expect(() =>
      validateApply({ stages: apply.stages.slice(0, 2), faq: [{ question: "Q?", answer: "[x](javascript:alert(1))" }] }),
    ).toThrow(/stages[\s\S]*must start with/);
    expect(() => validateApply({ ...apply, faq: [] })).toThrow(/faq/);
  });
});
