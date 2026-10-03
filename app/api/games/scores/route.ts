import { SAVES_PER_HOUR, nameThreshold, scoreRequest, scoreSubmission, shouldAskName } from "@/lib/games/scores";
import { claimPlayer, hasContact, hashIp, insertScore, personalBest, savesInLastHour, scoreStats } from "@/lib/games/scores-db";
import { sessionUserId } from "@/lib/games/session";

export type SaveScoreResponse = {
  scoreId: number;
  score: number;
  best: number;
  newBest: boolean;
  signedIn: boolean;
  askName: boolean;
};

/**
 * Saves a finished game (spec 03 §3.7). Every play is kept. Signed in: the score goes on the account and this
 * browser's earlier anonymous plays are claimed. Signed out: a top-10% score asks for a name.
 */
export async function POST(request: Request) {
  const parsed = scoreRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid score." }, { status: 400 });
  const result = scoreSubmission(parsed.data);
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });

  const { scored } = result;
  const { playerId } = parsed.data;
  const ipHash = hashIp(request.headers.get("x-forwarded-for"));
  if ((await savesInLastHour(playerId, ipHash)) >= SAVES_PER_HOUR) {
    return Response.json({ error: "Too many saves. Try again later." }, { status: 429 });
  }

  const userId = await sessionUserId(request);
  if (userId) await claimPlayer(playerId, userId);

  const previous = await personalBest(scored.game, userId ? { userId } : { playerId });
  const scoreId = await insertScore(scored, playerId, userId, ipHash);
  const stats = await scoreStats(scored.game);
  const askName = shouldAskName({
    signedIn: Boolean(userId),
    score: scored.score,
    threshold: nameThreshold(scored.game, stats.count, stats.p90),
    hasContact: userId ? true : await hasContact(playerId),
  });

  const body: SaveScoreResponse = {
    scoreId,
    score: scored.score,
    best: Math.max(previous ?? 0, scored.score),
    newBest: previous !== null && scored.score > previous,
    signedIn: Boolean(userId),
    askName,
  };
  return Response.json(body);
}
