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

/** Photo library. `home_order` 1–3 fills the Home "Inside the club" slots (01 §6); `membership_order` 1–3 the Membership photo band (03). */
export const photos = pgTable(
  "photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    image: jsonb("image").$type<StoredImage>().notNull(),
    alt: text("alt").notNull(),
    caption: text("caption").notNull(),
    ratio: text("ratio", { enum: ["3:2", "4:5"] }).notNull(),
    homeOrder: smallint("home_order"),
    membershipOrder: smallint("membership_order"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("photos_home_order_idx").on(t.homeOrder),
    check("photos_home_order_range", sql`${t.homeOrder} between 1 and 3`),
    uniqueIndex("photos_membership_order_idx").on(t.membershipOrder),
    check("photos_membership_order_range", sql`${t.membershipOrder} between 1 and 3`),
  ],
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
    /** "Show on Team page" (spec 06 rev 2): hidden people keep their row, e.g. a track lead only linked from /membership. */
    visible: boolean("visible").notNull().default(true),
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

/**
 * Who changed what, and when (spec 06 §5.1). `before`/`after` hold the row on each side of the change so Undo can write
 * `before` back through the save wrapper (spec 06 §3); null `before` means a create, null `after` a delete.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    actorId: text("actor_id").notNull(),
    actorEmail: text("actor_email"),
    action: text("action", {
      enum: [
        "create",
        "update",
        "delete",
        "reorder",
        "grant-admin",
        "revoke-admin",
        "invite",
        "revoke-invite",
        "undo",
        "add-members",
        "update-members",
        "remove-members",
        "approve-request",
        "decline-request",
      ],
    }).notNull(),
    entity: text("entity").notNull(),
    /** The changed row's id: a uuid as text, a track id, or a Clerk user id for admin changes. */
    entityId: text("entity_id"),
    entityLabel: text("entity_label").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
  },
  (t) => [index("audit_log_at_idx").on(t.at.desc()), index("audit_log_entity_idx").on(t.entity, t.entityId, t.at.desc())],
);

// ── Members (spec 06 §5.1, §9). Membership lives here, never in Clerk metadata. ──

/** The roster. Matched to a Clerk account by `user_id`, or by a verified email (case-insensitive), then linked. */
export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    status: text("status", { enum: ["active", "alumni", "inactive"] }).notNull().default("active"),
    track: text("track", { enum: ["trading", "research", "development"] }),
    classYear: smallint("class_year"),
    /** e.g. "Fall 2026": the recruiting cycle they joined in. */
    cohort: text("cohort"),
    userId: text("user_id").unique(),
    /** Visible to admins only. */
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [uniqueIndex("members_email_ci_idx").on(sql`lower(${t.email})`), index("members_status_idx").on(t.status)],
);

/** "Request access" from the portal. At most one pending request per user (partial unique index). */
export const membershipRequests = pgTable(
  "membership_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    note: text("note"),
    status: text("status", { enum: ["pending", "approved", "declined"] }).notNull().default("pending"),
    decidedBy: text("decided_by"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("membership_requests_one_pending_idx").on(t.userId).where(sql`${t.status} = 'pending'`),
    index("membership_requests_user_idx").on(t.userId, t.createdAt.desc()),
  ],
);
