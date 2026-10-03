/**
 * Seeds the admin-editable tables from content/*.ts and uploads their images to Vercel Blob (spec 06 §3).
 *
 *   pnpm db:seed            fills every table that is still empty
 *
 * Safe to re-run: a table that already has rows is skipped, so admin edits are never overwritten. Images go to
 * stable Blob paths (content/images/…), so re-uploading replaces identical files instead of adding copies.
 */
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { put } from "@vercel/blob";
import { count } from "drizzle-orm";
import sharp from "sharp";
import { about } from "@/content/about";
import { events as contentEvents } from "@/content/events";
import { home } from "@/content/home";
import { membership } from "@/content/membership";
import { placementWall } from "@/content/placement-wall";
import { placements as firmList } from "@/content/placements";
import { site } from "@/content/site";
import { team } from "@/content/team";
import type { ImageAsset } from "@/content/types";
import { db } from "@/lib/db/client";
import { events, people, photos, placements, settings, sponsors, tracks } from "@/lib/db/schema";
import { buildSeed } from "@/lib/seed/build";

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" };

/** Reads public/<src>, measures it, makes a 16px blur for raster images, and uploads it to a stable Blob path. */
async function upload(src: string): Promise<ImageAsset> {
  const file = await readFile(join(process.cwd(), "public", src));
  const ext = extname(src).toLowerCase();
  const meta = await sharp(file).metadata();
  const blur =
    ext === ".svg" ? undefined : `data:image/webp;base64,${(await sharp(file).resize(16).webp({ quality: 50 }).toBuffer()).toString("base64")}`;
  // Use the store's read-write token explicitly: a pulled VERCEL_OIDC_TOKEN is scoped to one environment and the
  // store may not accept it from a local run.
  const blob = await put(`content${src}`, file, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: TYPES[ext],
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return { src: blob.url, width: meta.width ?? 0, height: meta.height ?? 0, ...(blur ? { blurDataURL: blur } : {}) };
}

async function isEmpty(table: typeof photos | typeof placements | typeof people | typeof tracks | typeof sponsors | typeof events) {
  const [{ n }] = await db().select({ n: count() }).from(table);
  return n === 0;
}

async function main() {
  const input = { home, about, membership, team, placements: firmList, wall: placementWall, recruiting: site.recruiting, events: contentEvents };
  console.log(`Seeding ${new URL(process.env.DATABASE_URL ?? "postgres://unset").hostname.split(".")[0]}`);

  // Pass 1 collects every local image; upload each once; pass 2 swaps in the stored copies.
  const local = new Set<string>();
  buildSeed(input, (image) => (local.add(image.src), image));
  const stored = new Map<string, ImageAsset>();
  for (const src of local) {
    stored.set(src, await upload(src));
    console.log(`  uploaded ${src}`);
  }
  const rows = buildSeed(input, (image) => stored.get(image.src) ?? image);

  if (await isEmpty(placements)) await db().insert(placements).values(rows.placements);
  else console.log("  placements: has rows, skipped");

  if (await isEmpty(people)) {
    const firms = new Map((await db().select({ id: placements.id, firm: placements.firm }).from(placements)).map((p) => [p.firm.toLowerCase(), p.id]));
    await db()
      .insert(people)
      .values(rows.people.map(({ companyFirm, ...p }) => ({ ...p, companyId: companyFirm ? firms.get(companyFirm.toLowerCase()) : undefined })));
  } else console.log("  people: has rows, skipped");

  for (const [name, table, values] of [
    ["tracks", tracks, rows.tracks],
    ["photos", photos, rows.photos],
    ["sponsors", sponsors, rows.sponsors],
  ] as const) {
    if (values.length === 0) continue;
    if (await isEmpty(table)) await db().insert(table).values(values as never);
    else console.log(`  ${name}: has rows, skipped`);
  }

  // Phase 6: the recruiting setting only if none has been saved, and events only into an empty table.
  if (rows.recruiting) {
    const inserted = await db().insert(settings).values({ key: "recruiting", value: rows.recruiting }).onConflictDoNothing().returning();
    console.log(inserted.length ? "  recruiting: seeded" : "  recruiting: already set, skipped");
  }
  if (rows.events.length) {
    if (await isEmpty(events)) await db().insert(events).values(rows.events.map((e) => ({ ...e, endsAt: e.endsAt ?? null })));
    else console.log("  events: has rows, skipped");
  }

  console.log(
    `Done: ${rows.placements.length} placements, ${rows.people.length} people, ${rows.tracks.length} tracks, ${rows.photos.length} photos, ${rows.sponsors.length} sponsors.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
