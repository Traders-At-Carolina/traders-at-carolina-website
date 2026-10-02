import { describe, expect, it } from "vitest";
import type { StaticImageData } from "next/image";
import type { CompanyMark, Person } from "@/content/types";
import { companyMarks, execMembers, initials, shortClassYear, showPlacements, sortFirms, trackLeadNames } from "@/lib/team";
import { lowResHeadshots, validateTeam } from "@/lib/validate-team";

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

describe("lowResHeadshots", () => {
  const photo = (width: number) => ({ src: "/x.jpg", width, height: width, blurDataURL: "" }) as StaticImageData;
  const person = (slug: string, width?: number): Person => ({
    slug,
    name: slug,
    role: "Director",
    group: "director",
    order: 1,
    ...(width ? { headshot: photo(width), alt: `Portrait of ${slug}` } : {}),
  });

  it("lists only headshots narrower than 600px, ignoring people without one", () => {
    const team = { people: [person("small", 320), person("big", 960), person("none")] };
    expect(lowResHeadshots(team)).toEqual(["small"]);
  });

  it("warns but does not fail the build for low-res headshots", () => {
    expect(() => validateTeam({ people: [person("small", 240)] }, [])).not.toThrow();
  });
});

describe("companyMarks", () => {
  const mark = (name: string): CompanyMark => ({ name, logo: { src: `/${name}.png`, width: 96, height: 96 } as StaticImageData });
  const citadel = mark("Citadel");
  const aws = mark("AWS");

  it("returns each company once, in the order people first appear", () => {
    const list = [
      person({ slug: "a", name: "A", company: citadel }),
      person({ slug: "b", name: "B" }),
      person({ slug: "c", name: "C", company: aws }),
      person({ slug: "d", name: "D", company: citadel }),
    ];
    expect(companyMarks(list).map((c) => c.name)).toEqual(["Citadel", "AWS"]);
  });

  it("returns an empty list when nobody has a company", () => {
    expect(companyMarks(people)).toEqual([]);
  });
});
