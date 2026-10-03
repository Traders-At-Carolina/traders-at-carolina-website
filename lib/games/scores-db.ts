import { createHash } from "node:crypto";
import { and, count, desc, eq, gte, isNull, max, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { gameContacts, gameScores } from "@/lib/db/schema";
import type { Game, Scored } from "@/lib/games/scores";

/** Queries behind /api/games/* and /admin/games (spec 03 §3.7). */

/** SHA-256 of the client IP plus today's date: enough to rate-limit, rotates daily, never stores the address. */
export function hashIp(forwardedFor: string | null): string | null {
  const ip = forwardedFor?.split(",")[0]?.trim();
  if (!ip) return null;
  return createHash("sha256").update(`${ip}|${new Date().toISOString().slice(0, 10)}`).digest("hex");
}

export async function savesInLastHour(playerId: string, ipHash: string | null): Promise<number> {
  const since = sql`now() - interval '1 hour'`;
  const who = ipHash ? or(eq(gameScores.playerId, playerId), eq(gameScores.ipHash, ipHash)) : eq(gameScores.playerId, playerId);
  const [row] = await db().select({ n: count() }).from(gameScores).where(and(who, gte(gameScores.createdAt, since)));
  return row?.n ?? 0;
}

/** Moves a browser's anonymous scores and contacts onto the signed-in account. */
export async function claimPlayer(playerId: string, userId: string): Promise<void> {
  await db().update(gameScores).set({ userId }).where(and(eq(gameScores.playerId, playerId), isNull(gameScores.userId)));
  await db().update(gameContacts).set({ userId }).where(and(eq(gameContacts.playerId, playerId), isNull(gameContacts.userId)));
}

/** Best score so far, by account when signed in, otherwise by browser. */
export async function personalBest(game: Game, who: { userId: string } | { playerId: string }): Promise<number | null> {
  const owner = "userId" in who ? eq(gameScores.userId, who.userId) : eq(gameScores.playerId, who.playerId);
  const [row] = await db()
    .select({ best: max(gameScores.score) })
    .from(gameScores)
    .where(and(eq(gameScores.game, game), owner));
  return row?.best ?? null;
}

export async function insertScore(scored: Scored, playerId: string, userId: string | null, ipHash: string | null): Promise<number> {
  const [row] = await db()
    .insert(gameScores)
    .values({ game: scored.game, score: scored.score, detail: scored.detail, playerId, userId, ipHash })
    .returning({ id: gameScores.id });
  return row.id;
}

export async function scoreStats(game: Game): Promise<{ count: number; p90: number | null }> {
  const [row] = await db()
    .select({ count: count(), p90: sql<number | null>`percentile_cont(0.9) within group (order by ${gameScores.score})` })
    .from(gameScores)
    .where(eq(gameScores.game, game));
  return { count: row?.count ?? 0, p90: row?.p90 === null || row?.p90 === undefined ? null : Number(row.p90) };
}

export async function hasContact(playerId: string): Promise<boolean> {
  const [row] = await db().select({ n: count() }).from(gameContacts).where(eq(gameContacts.playerId, playerId));
  return (row?.n ?? 0) > 0;
}

/** True when the score exists and was played from this browser, so a contact can't be pinned to someone else's score. */
export async function scoreBelongsTo(scoreId: number, playerId: string): Promise<boolean> {
  const [row] = await db()
    .select({ n: count() })
    .from(gameScores)
    .where(and(eq(gameScores.id, scoreId), eq(gameScores.playerId, playerId)));
  return (row?.n ?? 0) > 0;
}

export async function insertContact(contact: { playerId: string; scoreId: number; name: string; email: string | null }): Promise<void> {
  await db().insert(gameContacts).values(contact);
}

/** For /admin/games: volunteered contacts with their score, newest first. */
export async function listContacts(limit = 200) {
  return db()
    .select({
      id: gameContacts.id,
      name: gameContacts.name,
      email: gameContacts.email,
      userId: gameContacts.userId,
      createdAt: gameContacts.createdAt,
      game: gameScores.game,
      score: gameScores.score,
    })
    .from(gameContacts)
    .innerJoin(gameScores, eq(gameContacts.scoreId, gameScores.id))
    .orderBy(desc(gameContacts.createdAt))
    .limit(limit);
}

export async function topScores(game: Game, limit = 10) {
  return db()
    .select({ id: gameScores.id, score: gameScores.score, userId: gameScores.userId, playerId: gameScores.playerId, createdAt: gameScores.createdAt })
    .from(gameScores)
    .where(eq(gameScores.game, game))
    .orderBy(desc(gameScores.score), gameScores.createdAt)
    .limit(limit);
}

export async function recentScores(limit = 50) {
  return db()
    .select({ id: gameScores.id, game: gameScores.game, score: gameScores.score, userId: gameScores.userId, playerId: gameScores.playerId, createdAt: gameScores.createdAt })
    .from(gameScores)
    .orderBy(desc(gameScores.createdAt))
    .limit(limit);
}
