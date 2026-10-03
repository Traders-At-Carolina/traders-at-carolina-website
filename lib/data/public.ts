import { asc, isNotNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { home } from "@/content/home";
import { membership } from "@/content/membership";
import type { HomePhoto } from "@/content/types";
import { db } from "@/lib/db/client";
import { photos } from "@/lib/db/schema";

/**
 * Cached reads for the public pages (spec 06 §3 Read path). Each getter carries its collection's tag; admin saves call
 * updateTag(tag), so the next visitor gets fresh content while pages stay statically generated.
 * Public pages must read editable content only through this module, or saves won't reach them.
 */
export const TAGS = { photos: "photos" } as const;

/** Bump when a getter's output shape changes: unstable_cache keeps entries across deployments. */
const VERSION = "v1";

/** Local development without a database falls back to content/*.ts. Production never does (spec 06 §3). */
const offline = () => !process.env.DATABASE_URL && process.env.NODE_ENV !== "production";

type PhotoRow = typeof photos.$inferSelect;

const toHomePhoto = (row: PhotoRow): HomePhoto => ({ src: row.image, alt: row.alt, caption: row.caption, ratio: row.ratio });

const slotted = (column: typeof photos.homeOrder | typeof photos.membershipOrder) =>
  db().select().from(photos).where(isNotNull(column)).orderBy(asc(column));

/** Home "Inside the club", in slot order (01 §6). */
export const getHomePhotos = unstable_cache(
  async (): Promise<HomePhoto[]> => (offline() ? home.photos : (await slotted(photos.homeOrder)).map(toHomePhoto)),
  ["home-photos", VERSION],
  { tags: [TAGS.photos] },
);

/** Membership photo bands: slot 1 runs wide, slots 2–3 pair after Activities (03). */
export const getMembershipPhotos = unstable_cache(
  async (): Promise<HomePhoto[]> => (offline() ? (membership.photos ?? []) : (await slotted(photos.membershipOrder)).map(toHomePhoto)),
  ["membership-photos", VERSION],
  { tags: [TAGS.photos] },
);
