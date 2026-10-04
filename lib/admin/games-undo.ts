import { eq, inArray } from "drizzle-orm";
import { FormError } from "@/lib/admin/action";
import type { Handler } from "@/lib/admin/undo";
import { db } from "@/lib/db/client";
import { gameContacts, gameScores } from "@/lib/db/schema";
import type { Game } from "@/lib/games/scores";

/**
 * Game moderation (spec 11 §5.4): deleting a score (with its volunteered contact) or a contact, and undoing either.
 * Scores are never edited, so a delete is undone by recreating the rows with their original ids and values.
 */

/**
 * Cache tag for the games leaderboard. Nothing public caches game scores yet (/api/games/* and /admin/games read the
 * database directly), so expiring it is a no-op today; a cached leaderboard must carry this tag to pick up deletes.
 */
export const GAMES_TAG = "games";

export const GAME_NAME: Record<Game, string> = { sprint: "Mental math sprint", fermi: "Fermi markets" };

type ScoreRow = typeof gameScores.$inferSelect;
type ContactRow = typeof gameContacts.$inferSelect;

/** Rows as stored in the audit log: plain JSON, dates as ISO strings. */
export type ContactSnapshot = Omit<ContactRow, "createdAt"> & { createdAt: string };
export type ScoreSnapshot = Omit<ScoreRow, "createdAt"> & { createdAt: string; contact: ContactSnapshot | null };

const iso = (d: Date | string) => (d instanceof Date ? d.toISOString() : new Date(d).toISOString());

export const contactSnapshot = (r: ContactRow): ContactSnapshot => ({
  id: r.id,
  playerId: r.playerId,
  userId: r.userId,
  name: r.name,
  email: r.email,
  scoreId: r.scoreId,
  createdAt: iso(r.createdAt),
});

export const scoreSnapshot = (r: ScoreRow, contact: ContactRow | null): ScoreSnapshot => ({
  id: r.id,
  game: r.game,
  score: r.score,
  detail: r.detail,
  playerId: r.playerId,
  userId: r.userId,
  ipHash: r.ipHash,
  createdAt: iso(r.createdAt),
  contact: contact ? contactSnapshot(contact) : null,
});

export const scoreLabel = (s: { game: Game; score: number }) => `${GAME_NAME[s.game]} score ${s.score}`;

type Batch = Parameters<ReturnType<typeof db>["batch"]>[0];

export async function getScoreWithContact(id: number): Promise<ScoreSnapshot | undefined> {
  const [row] = await db().select().from(gameScores).where(eq(gameScores.id, id)).limit(1);
  if (!row) return undefined;
  const [contact] = await db().select().from(gameContacts).where(eq(gameContacts.scoreId, id)).limit(1);
  return scoreSnapshot(row, contact ?? null);
}

export async function getContact(id: number): Promise<ContactSnapshot | undefined> {
  const [row] = await db().select().from(gameContacts).where(eq(gameContacts.id, id)).limit(1);
  return row ? contactSnapshot(row) : undefined;
}

/** Deletes a score and its volunteered contact together, returning both as they were. */
export async function deleteScore(id: number): Promise<ScoreSnapshot> {
  const before = await getScoreWithContact(id);
  if (!before) throw new FormError("That score is already gone.");
  await db().batch([db().delete(gameContacts).where(eq(gameContacts.scoreId, id)), db().delete(gameScores).where(eq(gameScores.id, id))] as unknown as Batch);
  return before;
}

/** Deletes one contact; its score stays on the leaderboard. */
export async function deleteContact(id: number): Promise<ContactSnapshot> {
  const before = await getContact(id);
  if (!before) throw new FormError("That contact is already gone.");
  await db().delete(gameContacts).where(eq(gameContacts.id, id));
  return before;
}

const contactValues = (c: ContactSnapshot) => ({ ...c, createdAt: new Date(c.createdAt) });

/** Recreates a deleted score, then its contact, with their original ids. */
export async function restoreScore(s: ScoreSnapshot): Promise<ScoreSnapshot> {
  const { contact, ...score } = s;
  const writes: unknown[] = [db().insert(gameScores).values({ ...score, createdAt: new Date(score.createdAt) })];
  if (contact) writes.push(db().insert(gameContacts).values(contactValues(contact)));
  await db().batch(writes as unknown as Batch);
  return s;
}

/** Recreates a deleted contact, as long as its score still exists. */
export async function restoreContact(c: ContactSnapshot): Promise<ContactSnapshot> {
  const [score] = await db().select({ id: gameScores.id }).from(gameScores).where(eq(gameScores.id, c.scoreId)).limit(1);
  if (!score) throw new FormError("Its score has been deleted since. Undo that first.");
  await db().insert(gameContacts).values(contactValues(c));
  return c;
}

/** Volunteered contact names by score id, so the delete dialog can say what goes with a score. */
export async function contactNamesByScore(scoreIds: number[]): Promise<Map<number, string>> {
  const ids = [...new Set(scoreIds)];
  if (ids.length === 0) return new Map();
  const rows = await db().select({ scoreId: gameContacts.scoreId, name: gameContacts.name }).from(gameContacts).where(inArray(gameContacts.scoreId, ids));
  return new Map(rows.map((r) => [r.scoreId, r.name]));
}

const toId = (entityId: string) => {
  const id = Number(entityId);
  if (!Number.isSafeInteger(id) || id <= 0) throw new FormError("This change can't be undone.");
  return id;
};

const notEdited = async (): Promise<never> => {
  throw new FormError("This change can't be undone.");
};

const gameScore: Handler = {
  label: "Game score",
  tags: [GAMES_TAG],
  viewHref: () => "/admin/games",
  // Undoing an undo: delete the recreated score (and contact) again.
  remove: async (id) => ({ before: await deleteScore(toId(id)) }),
  recreate: async (state) => ({ after: await restoreScore(state as ScoreSnapshot) }),
  restore: notEdited,
};

const gameContact: Handler = {
  label: "Game contact",
  tags: [GAMES_TAG],
  viewHref: () => "/admin/games",
  remove: async (id) => ({ before: await deleteContact(toId(id)) }),
  recreate: async (state) => ({ after: await restoreContact(state as ContactSnapshot) }),
  restore: notEdited,
};

export const GAME_UNDO_HANDLERS: Record<string, Handler> = { "game-score": gameScore, "game-contact": gameContact };

export const GAME_AREAS: Record<string, string> = { "game-score": "Game scores", "game-contact": "Game scores" };
