import { describe, expect, it } from "vitest";
import { aboutSectionKeys, resolvePartnerFirms, showMilestones, sortPartners, sortTimeline } from "@/lib/about";
import { validateAbout } from "@/lib/validate-about";
import type { AboutContent, TimelineEntry } from "@/content/types";

const about: AboutContent = {
  header: { h1: "H1", lead: "Lead." },
  headings: { mission: "M", story: "S", principles: "P", partners: "Pa", advisorsOnly: "A" },
  mission: { statement: "Mission.", body: "Body." },
  vision: { statement: "Vision.", body: "Body." },
  story: { paragraphs: [] },
  principles: [
    { title: "One", body: "B." },
    { title: "Two", body: "B." },
    { title: "Three", body: "B." },
  ],
  partners: [],
  advisors: [],
};
const milestones = (n: number): TimelineEntry[] => Array.from({ length: n }, (_, i) => ({ year: 2020 + i, title: `M${i}` }));

describe("sorting", () => {
  it("sorts partners alphabetically, ignoring case", () => {
    expect(sortPartners([{ name: "optiver" }, { name: "Citadel" }, { name: "Jane Street" }]).map((p) => p.name)).toEqual([
      "Citadel",
      "Jane Street",
      "optiver",
    ]);
  });

  it("sorts the timeline oldest first", () => {
    expect(sortTimeline([{ year: 2023, title: "b" }, { year: 2019, title: "a" }]).map((t) => t.year)).toEqual([2019, 2023]);
  });
});

describe("showMilestones", () => {
  it("needs at least three entries", () => {
    expect(showMilestones(milestones(2))).toBe(false);
    expect(showMilestones(milestones(3))).toBe(true);
  });
});

describe("aboutSectionKeys", () => {
  it("omits story and partners when there is no content", () => {
    expect(aboutSectionKeys(about, [])).toEqual(["mission", "principles"]);
  });

  it("includes story for paragraphs or 3+ milestones, and partners for partners or advisors", () => {
    expect(aboutSectionKeys({ ...about, story: { paragraphs: ["a", "b"] } }, [])).toEqual(["mission", "story", "principles"]);
    expect(aboutSectionKeys(about, milestones(3))).toEqual(["mission", "story", "principles"]);
    expect(aboutSectionKeys({ ...about, advisors: [{ name: "Dr. X", title: "Professor", department: "STOR" }] }, [])).toEqual([
      "mission",
      "principles",
      "partners",
    ]);
  });
});

describe("resolvePartnerFirms", () => {
  it("prefers an explicit stat, else counts partners, else nothing", () => {
    expect(resolvePartnerFirms(5, [{ name: "A" }])).toBe(5);
    expect(resolvePartnerFirms(undefined, [{ name: "A" }, { name: "B" }])).toBe(2);
    expect(resolvePartnerFirms(undefined, [])).toBeUndefined();
  });
});

describe("validateAbout", () => {
  it("accepts working-copy content with nothing optional", () => {
    expect(() => validateAbout(about, [])).not.toThrow();
  });

  it("requires 3–4 principles", () => {
    expect(() => validateAbout({ ...about, principles: about.principles.slice(0, 2) }, [])).toThrow(/principles/);
  });

  it("requires 0 or 2–4 story paragraphs and a story for any quote", () => {
    expect(() => validateAbout({ ...about, story: { paragraphs: ["only one"] } }, [])).toThrow(/paragraphs/);
    const quote = { text: "Q", name: "N", role: "Founder" };
    expect(() => validateAbout({ ...about, story: { paragraphs: [], quote } }, [])).toThrow(/quote/);
  });

  it("rejects duplicate partners and non-https partner links", () => {
    const partners = [{ name: "Optiver" }, { name: "optiver" }, { name: "SIG", url: "http://sig.com" }];
    expect(() => validateAbout({ ...about, partners }, [])).toThrow(/duplicate[\s\S]*https/);
  });

  it("rejects non-integer or implausible milestone years", () => {
    expect(() => validateAbout(about, [{ year: 20.5, title: "x" }])).toThrow(/timeline/);
  });
});
