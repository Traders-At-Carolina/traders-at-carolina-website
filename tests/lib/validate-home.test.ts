import { describe, expect, it } from "vitest";
import type { StaticImageData } from "next/image";
import { validateHome } from "@/lib/validate-home";
import type { HomeContent, HomePhoto } from "@/content/types";

const image = { src: "/images/events/x.jpg", width: 1800, height: 1200 } as StaticImageData;
const photo = (n: number): HomePhoto => ({ src: image, alt: `Members at event ${n}`, caption: `Event ${n}`, ratio: "3:2" });

const valid: HomeContent = {
  hero: { headline: "Rigor, practiced together.", headlineEmphasis: "practiced", subhead: "Subhead." },
  pillars: [
    { title: "Preparation", body: "Body.", link: { label: "See the curriculum", href: "/membership" } },
    { title: "Engagement", body: "Body.", link: { label: "How membership works", href: "/membership" } },
    { title: "Opportunity", body: "Body.", link: { label: "About the club", href: "/about" } },
  ],
  stats: {},
  photos: [],
};

describe("validateHome", () => {
  it("accepts content with no stats, photos or upcoming event", () => {
    expect(() => validateHome(valid)).not.toThrow();
  });

  it("accepts 2 or 3 photos", () => {
    expect(() => validateHome({ ...valid, photos: [photo(1), photo(2)] })).not.toThrow();
    expect(() => validateHome({ ...valid, photos: [photo(1), photo(2), photo(3)] })).not.toThrow();
  });

  it("rejects exactly one photo or more than three", () => {
    expect(() => validateHome({ ...valid, photos: [photo(1)] })).toThrow(/photos/);
    expect(() => validateHome({ ...valid, photos: [1, 2, 3, 4].map(photo) })).toThrow(/photos/);
  });

  it("rejects empty alt text and captions", () => {
    const bad = { ...photo(1), alt: " ", caption: "" };
    expect(() => validateHome({ ...valid, photos: [bad, photo(2)] })).toThrow(/alt[\s\S]*caption/);
  });

  it("rejects an emphasis that isn't part of the headline", () => {
    expect(() => validateHome({ ...valid, hero: { ...valid.hero, headlineEmphasis: "rigorous" } })).toThrow(
      /headlineEmphasis/,
    );
  });

  it("requires exactly three pillars", () => {
    expect(() => validateHome({ ...valid, pillars: valid.pillars.slice(0, 2) })).toThrow(/pillars/);
  });

  it("rejects a malformed upcoming date", () => {
    const upcoming = { title: "Mock trading night", date: "Oct 16", location: "Gardner Hall" };
    expect(() => validateHome({ ...valid, upcoming })).toThrow(/upcoming\.date/);
  });
});
