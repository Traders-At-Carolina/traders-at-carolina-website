import { describe, expect, it } from "vitest";
import type { StaticImageData } from "next/image";
import type { Person } from "@/content/types";
import { execMembers, initials, shortClassYear, showPlacements, sortFirms, trackGroups, trackLeadNames } from "@/lib/team";
import { validateTeam } from "@/lib/validate-team";

const person = (p: Partial<Person> & Pick<Person, "slug" | "name">): Person => ({
  role: "Member",
  group: "exec",
  order: 1,
  classYear: 2027,
  major: "Mathematics",
  ...p,
});

const people: Person[] = [
  person({ slug: "vp", name: "Vic Pres", role: "Vice President", order: 2 }),
  person({ slug: "pres", name: "Ada Lovelace", role: "President", order: 1, track: "research" }),
  person({ slug: "t-lead", name: "Tom Trader", role: "Trading Lead", group: "track-lead", track: "trading" }),
];

describe("team grouping", () => {
  it("orders exec members by order", () => {
    expect(execMembers(people).map((p) => p.slug)).toEqual(["pres", "vp"]);
  });

  it("groups leads by track in fixed order and keeps exec leads separate", () => {
    const groups = trackGroups(people);
    expect(groups.map((g) => g.track)).toEqual(["trading", "research", "development"]);
    expect(groups[0].leads.map((p) => p.slug)).toEqual(["t-lead"]);
    expect(groups[1].leads).toEqual([]);
    expect(groups[1].execLeads.map((p) => p.slug)).toEqual(["pres"]);
    expect(groups[2].leads).toEqual([]);
  });

  it("maps everyone with a track to their name for membership links", () => {
    expect(trackLeadNames(people)).toEqual({ pres: "Ada Lovelace", "t-lead": "Tom Trader" });
  });
});

describe("formatting", () => {
  it("builds initials and short class years", () => {
    expect(initials("Ada King Lovelace")).toBe("AL");
    expect(initials("Cher")).toBe("C");
    expect(shortClassYear(2027)).toBe("'27");
  });

  it("shows placements at five firms, sorted alphabetically", () => {
    const firms = ["SIG", "citadel", "Jane Street", "Optiver"].map((firm) => ({ firm }));
    expect(showPlacements(firms)).toBe(false);
    expect(showPlacements([...firms, { firm: "HRT" }])).toBe(true);
    expect(sortFirms(firms)).toEqual(["citadel", "Jane Street", "Optiver", "SIG"]);
  });
});

describe("validateTeam", () => {
  it("accepts an empty team", () => {
    expect(() => validateTeam({ people: [] }, [])).not.toThrow();
  });

  it("lists every problem", () => {
    const image = { src: "/x.jpg", width: 800, height: 1000 } as StaticImageData;
    const bad: Person[] = [
      person({ slug: "Jane_Doe", name: "Jane" }),
      person({ slug: "dup", name: "A" }),
      person({ slug: "dup", name: "B" }),
      person({ slug: "lead", name: "L", group: "track-lead" }),
      person({ slug: "pic", name: "P", headshot: image }),
      person({ slug: "li", name: "Q", linkedin: "http://linkedin.com/in/q" }),
    ];
    expect(() => validateTeam({ people: bad }, [{ firm: "SIG" }, { firm: "sig" }])).toThrow(
      /kebab-case[\s\S]*duplicate slug[\s\S]*need a track[\s\S]*alt text[\s\S]*https[\s\S]*duplicate firm/,
    );
  });
});
