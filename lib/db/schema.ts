import { sql } from "drizzle-orm";
import { bigint, bigserial, boolean, check, index, integer, jsonb, pgTable, smallint, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/**
 * Every finished mini-game on /membership (spec 03 §3.7). `player_id` is a random id kept in the visitor's browser;
 * `user_id` is the Clerk user once they're signed in, set on new plays and on claim of the browser's earlier ones.
 */
export const gameScores = pgTable(
  "game_scores",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    game: text("game", { enum: ["sprint", "fermi"] }).notNull(),
    score: integer("score").notNull(),
    /** Sprint: { correct, skipped }. Fermi: { quotes: [{ id, low, high }] }, the inputs the score was recomputed from. */
    detail: jsonb("detail").notNull(),
    playerId: uuid("player_id").notNull(),
    userId: text("user_id"),
    /** SHA-256 of IP + day, for rate limiting only; it rotates daily and can't be reversed to an address. */
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("game_scores_game_score_idx").on(t.game, t.score), index("game_scores_player_idx").on(t.playerId), index("game_scores_user_idx").on(t.userId)],
);

/** A name (and optional email) volunteered after a top-10% score by a signed-out visitor. Officers only (/admin/games). */
export const gameContacts = pgTable(
  "game_contacts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    playerId: uuid("player_id").notNull(),
    userId: text("user_id"),
    name: text("name").notNull(),
    email: text("email"),
    scoreId: bigint("score_id", { mode: "number" })
      .notNull()
      .references(() => gameScores.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("game_contacts_player_idx").on(t.playerId)],
);

// ── Site content edited at /admin (spec 06 §5). content/*.ts is seed input once a collection is cut over. ──

/** Same shape as content/types.ts ImageAsset (kept local: drizzle-kit loads this file without the @/ alias). */
type StoredImage = { src: string; width: number; height: number; blurDataURL?: string };

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/** Photo library; `home_order` 1–3 puts a photo in the Home "Inside the club" section (spec 01 §6). */
export const photos = pgTable(
  "photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    image: jsonb("image").$type<StoredImage>().notNull(),
    alt: text("alt").notNull(),
    caption: text("caption").notNull(),
    ratio: text("ratio", { enum: ["3:2", "4:5"] }).notNull(),
    homeOrder: smallint("home_order"),
    ...timestamps,
  },
  (t) => [uniqueIndex("photos_home_order_idx").on(t.homeOrder), check("photos_home_order_range", sql`${t.homeOrder} between 1 and 3`)],
);

/** Firms members have joined. Feeds the Team firm list, the placement wall and officers' company badges (spec 04). */
export const placements = pgTable(
  "placements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firm: text("firm").notNull(),
    /** Full-colour mark for light backgrounds. */
    logo: jsonb("logo").$type<StoredImage>(),
    /** Optional variant for dark backgrounds (the headshot badge), e.g. AWS's white-text mark. */
    logoOnDark: jsonb("logo_on_dark").$type<StoredImage>(),
    showOnWall: boolean("show_on_wall").notNull().default(false),
    wallOrder: smallint("wall_order"),
    ...timestamps,
  },
  (t) => [uniqueIndex("placements_firm_ci_idx").on(sql`lower(${t.firm})`)],
);

/** Leadership roster (spec 04 §5). `slug` is fixed at creation so /team#slug links keep working. */
export const people = pgTable(
  "people",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    role: text("role").notNull(),
    group: text("group", { enum: ["co-president", "exec", "director", "track-lead"] }).notNull(),
    track: text("track", { enum: ["trading", "research", "development"] }),
    sortOrder: smallint("sort_order").notNull(),
    classYear: smallint("class_year"),
    major: text("major"),
    headshot: jsonb("headshot").$type<StoredImage>(),
    alt: text("alt"),
    placementNote: text("placement_note"),
    companyId: uuid("company_id").references(() => placements.id, { onDelete: "set null" }),
    linkedin: text("linkedin"),
    ...timestamps,
  },
  (t) => [index("people_group_order_idx").on(t.group, t.sortOrder)],
);

/** The three fixed tracks (spec 03 §5): rows are seeded once and only ever updated. */
export const tracks = pgTable("tracks", {
  id: text("id", { enum: ["trading", "research", "development"] }).primaryKey(),
  roleLabel: text("role_label").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  goodFit: text("good_fit"),
  sampleProblem: text("sample_problem"),
  recommendedBackground: text("recommended_background").array().notNull(),
  leadSlug: text("lead_slug").references(() => people.slug, { onDelete: "set null", onUpdate: "cascade" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Sponsors on About and Home (spec 02 §5). Logos render as a single-colour mask, so they need a transparent background. */
export const sponsors = pgTable(
  "sponsors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    relationship: text("relationship"),
    url: text("url"),
    logo: jsonb("logo").$type<StoredImage>(),
    ...timestamps,
  },
  (t) => [uniqueIndex("sponsors_name_ci_idx").on(sql`lower(${t.name})`)],
);

/** Who changed what, and when (spec 06 §5). No diffs: enough to answer "who deleted X". */
export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    actorId: text("actor_id").notNull(),
    actorEmail: text("actor_email"),
    action: text("action", { enum: ["create", "update", "delete", "reorder", "grant-admin", "revoke-admin", "invite", "revoke-invite"] }).notNull(),
    entity: text("entity").notNull(),
    entityLabel: text("entity_label").notNull(),
  },
  (t) => [index("audit_log_at_idx").on(t.at.desc())],
);
