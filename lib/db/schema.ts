import { bigint, bigserial, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
