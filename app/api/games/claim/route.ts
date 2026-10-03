import { claimRequest } from "@/lib/games/scores";
import { claimPlayer } from "@/lib/games/scores-db";
import { sessionUserId } from "@/lib/games/session";

/** After sign-in, moves this browser's anonymous game history onto the account. */
export async function POST(request: Request) {
  const parsed = claimRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });

  const userId = await sessionUserId(request);
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });

  await claimPlayer(parsed.data.playerId, userId);
  return Response.json({ ok: true });
}
