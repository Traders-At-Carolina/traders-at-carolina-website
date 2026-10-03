import { describe, expect, it } from "vitest";
import { apply } from "@/content/apply";
import type { Recruiting } from "@/content/types";
import { applyBandCopy, applyPrimaryAction, applyStatusCopy, formatDateRange, stageDates, stageEfforts, visibleFaq } from "@/lib/apply";
import { getApplicationState } from "@/lib/applications";
import { inlineToPlainText, parseInline } from "@/lib/inline-markdown";
import { collectApplyProblems, validateApply } from "@/lib/validate-apply";

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

  it("leads with the interest form when closed, with no competing link", () => {
    const r = { ...closed, interestFormUrl: "https://forms.gle/notify", nextApplicationOpenDate: "2027-08-25" };
    const copy = applyStatusCopy(getApplicationState(now, r), r, "hi@club.org", now);
    expect(copy).toMatchObject({
      title: "Be first to know when applications open.",
      statusLine: "Applications are closed · The next cycle opens Wed, Aug 25.",
      note: "Name and email only · No experience needed to apply",
    });
    expect(copy.action).toEqual({ label: "Keep me posted", href: "https://forms.gle/notify", external: true });
    expect(copy.secondary).toBeUndefined();
  });

  it("falls back to email, then the FAQ, without an interest form", () => {
    expect(applyStatusCopy(getApplicationState(now, closed), closed, "hi@club.org", now).secondary).toEqual({
      label: "Email us",
      href: "mailto:hi@club.org",
    });
    const copy = applyStatusCopy(getApplicationState(now, closed), closed, undefined, now);
    expect(copy.title).toBe("Applications are closed.");
    expect(copy.action).toBeUndefined();
    expect(copy.statusLine).toBe("We recruit each fall and spring.");
    expect(copy.secondary?.href).toBe("#faq");
  });
});

describe("applyBandCopy", () => {
  it("matches the state and looks ahead when closed", () => {
    expect(applyBandCopy(getApplicationState(now, open), open, undefined, now)).toMatchObject({
      title: "Ready when you are.",
      lead: "Applications close Sat, Feb 6.",
    });
    const notify = { ...closed, interestFormUrl: "https://forms.gle/notify" };
    expect(applyBandCopy(getApplicationState(now, notify), notify, undefined, now)).toMatchObject({
      title: "Don't miss the next cycle.",
      lead: "We'll email you when applications open.",
      action: { label: "Keep me posted", href: "https://forms.gle/notify" },
    });
    const dated = { ...notify, nextApplicationOpenDate: "2027-08-25" };
    expect(applyBandCopy(getApplicationState(now, dated), dated, undefined, now).lead).toBe(
      "Applications open Wed, Aug 25. We'll email you when they do.",
    );
    expect(applyBandCopy(getApplicationState(now, closed), closed, undefined, now).action.label).toBe("Read the FAQ");
  });
});

describe("applyPrimaryAction", () => {
  it("points at the form for the current state", () => {
    expect(applyPrimaryAction(getApplicationState(now, open), open, undefined).href).toBe("https://forms.gle/apply");
    const notify = { ...closed, interestFormUrl: "https://forms.gle/notify" };
    expect(applyPrimaryAction(getApplicationState(now, notify), notify, undefined).label).toBe("Keep me posted");
    expect(applyPrimaryAction(getApplicationState(now, closed), closed, "hi@club.org").href).toBe("mailto:hi@club.org");
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

  it("states the application length when known", () => {
    const stages = [{ title: "A", description: "a", effort: "Short form" }, { title: "B", description: "b", effort: "One chat" }];
    expect(stageEfforts(stages, open)).toEqual(["About 20 minutes", "One chat"]);
    expect(stageEfforts(stages, closed)).toEqual(["Short form", "One chat"]);
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

describe("visibleFaq", () => {
  const faq = [
    { question: "Real?", answer: "Yes." },
    { question: "Draft?", answer: "Maybe.", draft: true },
  ];
  it("hides drafts on production only", () => {
    expect(visibleFaq(faq, "production").map((f) => f.question)).toEqual(["Real?"]);
    expect(visibleFaq(faq, "preview")).toHaveLength(2);
    expect(visibleFaq(faq, undefined)).toHaveLength(2);
  });
});

describe("validateApply", () => {
  it("accepts the shipped content", () => {
    expect(() => validateApply(apply)).not.toThrow();
  });

  it("requires three benefits and stages, a FAQ and safe links", () => {
    expect(() =>
      validateApply({
        benefits: apply.benefits.slice(0, 2),
        stages: apply.stages.slice(0, 2),
        faq: [{ question: "Q?", answer: "[x](javascript:alert(1))" }],
      }),
    ).toThrow(/benefits[\s\S]*stages[\s\S]*must start with/);
    expect(() => validateApply({ ...apply, faq: [] })).toThrow(/faq/);
  });

  it("needs at least one published answer", () => {
    expect(() => validateApply({ ...apply, faq: [{ question: "Q?", answer: "A.", draft: true }] })).toThrow(/published/);
  });
});

describe("collectApplyProblems", () => {
  it("returns no problems for the shipped content", () => {
    expect(collectApplyProblems(apply)).toEqual([]);
  });

  it("returns problems instead of throwing", () => {
    expect(collectApplyProblems({ ...apply, faq: [] })).toEqual(["faq must have at least 1 published (non-draft) entry"]);
  });
});
