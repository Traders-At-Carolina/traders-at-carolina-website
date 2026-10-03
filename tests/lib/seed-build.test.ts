import { describe, expect, it } from "vitest";
import type { CompanyMark, HomeContent, ImageAsset, MembershipContent, Person } from "@/content/types";
import { about } from "@/content/about";
import { home } from "@/content/home";
import { membership } from "@/content/membership";
import { buildSeed, type SeedInput } from "@/lib/seed/build";

const img = (src: string): ImageAsset => ({ src, width: 100, height: 100 });
const mark = (name: string, src: string): CompanyMark => ({ name, logo: img(src) });

const person = (p: Partial<Person> & Pick<Person, "slug" | "name">): Person => ({ role: "Member", group: "exec", order: 1, ...p });

const input = (over: Partial<SeedInput> = {}): SeedInput => ({
  home: { ...home, photos: [] } as HomeContent,
  about: { ...about, partners: [] },
  membership: membership as MembershipContent,
  team: { people: [] },
  placements: [],
  wall: [],
  ...over,
});

describe("buildSeed", () => {
  it("puts the Home photos in the library in Home order", () => {
    const photos = [
      { src: img("/images/events/a.jpg"), alt: "A", caption: "First", ratio: "3:2" as const },
      { src: img("/images/events/b.jpg"), alt: "B", caption: "Second", ratio: "4:5" as const },
    ];
    const rows = buildSeed(input({ home: { ...home, photos } }));
    expect(rows.photos.map((p) => [p.caption, p.homeOrder, p.image.src])).toEqual([
      ["First", 1, "/images/events/a.jpg"],
      ["Second", 2, "/images/events/b.jpg"],
    ]);
  });

  it("merges the wall, people's companies and the firm list into one placement per firm", () => {
    const wall = [mark("Citadel", "/c.png"), mark("AWS", "/aws-on-light.png")];
    const people = [
      person({ slug: "a", name: "A", company: mark("AWS", "/aws.png") }),
      person({ slug: "b", name: "B", company: mark("Citadel", "/c.png") }),
      person({ slug: "c", name: "C", company: mark("Infragrid", "/i.png") }),
    ];
    const rows = buildSeed(input({ wall, team: { people }, placements: [{ firm: "citadel" }, { firm: "SIG" }] }));
    expect(rows.placements).toEqual([
      { firm: "Citadel", logo: img("/c.png"), showOnWall: true, wallOrder: 1 },
      { firm: "AWS", logo: img("/aws-on-light.png"), logoOnDark: img("/aws.png"), showOnWall: true, wallOrder: 2 },
      { firm: "Infragrid", logo: img("/i.png"), showOnWall: false },
      { firm: "SIG", showOnWall: false },
    ]);
  });

  it("links people to their company by firm and keeps their order, role and placement line", () => {
    const people = [person({ slug: "ada", name: "Ada", role: "President", order: 2, placement: "Previously at AWS", company: mark("AWS", "/aws.png") })];
    const [row] = buildSeed(input({ team: { people } })).people;
    expect(row).toMatchObject({ slug: "ada", name: "Ada", role: "President", group: "exec", sortOrder: 2, placementNote: "Previously at AWS", companyFirm: "AWS" });
  });

  it("copies the three tracks and the sponsors", () => {
    const partners = [{ name: "Jane Street", relationship: "Sponsor", logo: img("/images/sponsors/js.svg") }];
    const rows = buildSeed(input({ about: { ...about, partners } }));
    expect(rows.tracks.map((t) => t.id)).toEqual(["trading", "research", "development"]);
    expect(rows.tracks[0].recommendedBackground.length).toBeGreaterThanOrEqual(2);
    expect(rows.sponsors).toEqual([{ name: "Jane Street", relationship: "Sponsor", logo: img("/images/sponsors/js.svg") }]);
  });

  it("passes every image through the resolver, e.g. to swap local paths for Blob URLs", () => {
    const people = [person({ slug: "a", name: "A", headshot: img("/images/team/a.jpg"), alt: "Portrait of A" })];
    const rows = buildSeed(input({ team: { people } }), (i) => ({ ...i, src: `https://blob.test${i.src}` }));
    expect(rows.people[0].headshot?.src).toBe("https://blob.test/images/team/a.jpg");
  });
});
