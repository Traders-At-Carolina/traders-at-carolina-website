import type { AboutContent, CompanyMark, HomeContent, ImageAsset, MembershipContent, Person, Placement, TeamContent } from "@/content/types";

/** Today's content modules: the source the database is seeded from (spec 06 §3). */
export type SeedInput = {
  home: HomeContent;
  about: AboutContent;
  membership: MembershipContent;
  team: TeamContent;
  placements: Placement[];
  wall: CompanyMark[];
};

export type PlacementRow = { firm: string; logo?: ImageAsset; logoOnDark?: ImageAsset; showOnWall: boolean; wallOrder?: number };

export type SeedRows = {
  photos: Array<{ image: ImageAsset; alt: string; caption: string; ratio: "3:2" | "4:5"; homeOrder: number }>;
  placements: PlacementRow[];
  people: Array<{
    slug: string;
    name: string;
    role: string;
    group: Person["group"];
    track?: Person["track"];
    sortOrder: number;
    classYear?: number;
    major?: string;
    headshot?: ImageAsset;
    alt?: string;
    placementNote?: string;
    linkedin?: string;
    /** Resolved to placements.id by the runner. */
    companyFirm?: string;
  }>;
  tracks: Array<{
    id: MembershipContent["tracks"][number]["id"];
    roleLabel: string;
    name: string;
    description: string;
    goodFit?: string;
    sampleProblem?: string;
    recommendedBackground: string[];
    leadSlug?: string;
  }>;
  sponsors: Array<{ name: string; relationship?: string; url?: string; logo?: ImageAsset }>;
};

const key = (firm: string) => firm.trim().toLowerCase();

/**
 * Maps the content modules to table rows. Pure: `resolve` swaps each local image for its stored copy (the runner
 * uploads to Blob first), so tests can pass the identity.
 */
export function buildSeed(input: SeedInput, resolve: (image: ImageAsset) => ImageAsset = (image) => image): SeedRows {
  const img = (image: ImageAsset | undefined) => (image ? resolve(image) : undefined);

  // One row per firm: the wall sets the light-background logo and order; a person's badge mark that differs
  // (e.g. AWS's white-text logo for the dark headshot) becomes the on-dark variant.
  const placements = new Map<string, PlacementRow>();
  input.wall.forEach((m, i) => placements.set(key(m.name), { firm: m.name, logo: img(m.logo), showOnWall: true, wallOrder: i + 1 }));
  for (const company of input.team.people.flatMap((p) => (p.company ? [p.company] : []))) {
    const row = placements.get(key(company.name));
    if (!row) placements.set(key(company.name), { firm: company.name, logo: img(company.logo), showOnWall: false });
    else if (!row.logoOnDark && row.logo?.src !== resolve(company.logo).src) row.logoOnDark = img(company.logo);
  }
  for (const { firm } of input.placements) {
    if (!placements.has(key(firm))) placements.set(key(firm), { firm, showOnWall: false });
  }

  return {
    photos: input.home.photos.map((p, i) => ({ image: resolve(p.src), alt: p.alt, caption: p.caption, ratio: p.ratio, homeOrder: i + 1 })),
    placements: [...placements.values()],
    people: input.team.people.map((p) => ({
      slug: p.slug,
      name: p.name,
      role: p.role,
      group: p.group,
      track: p.track,
      sortOrder: p.order,
      classYear: p.classYear,
      major: p.major,
      headshot: img(p.headshot),
      alt: p.alt,
      placementNote: p.placement,
      linkedin: p.linkedin,
      companyFirm: p.company?.name,
    })),
    tracks: input.membership.tracks.map((t) => ({
      id: t.id,
      roleLabel: t.roleLabel,
      name: t.name,
      description: t.description,
      goodFit: t.goodFit,
      sampleProblem: t.sampleProblem,
      recommendedBackground: t.recommendedBackground,
      leadSlug: t.leadSlug,
    })),
    sponsors: input.about.partners.map((p) => ({ name: p.name, relationship: p.relationship, url: p.url, logo: img(p.logo) })),
  };
}
