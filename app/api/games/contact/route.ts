import { contactRequest } from "@/lib/games/scores";
import { insertContact, scoreBelongsTo } from "@/lib/games/scores-db";
import { sessionUserId } from "@/lib/games/session";

/** Stores the name (and optional email) a signed-out visitor volunteers after a top score. Officers see it in /admin/games. */
export async function POST(request: Request) {
  const parsed = contactRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a name of up to 60 characters and a valid email, or leave email blank." }, { status: 400 });

  const { playerId, scoreId, name, email } = parsed.data;
  if (!(await scoreBelongsTo(scoreId, playerId))) return Response.json({ error: "Score not found." }, { status: 404 });

  const userId = await sessionUserId(request);
  if (userId) return Response.json({ error: "Signed-in scores are already on your account." }, { status: 409 });

  await insertContact({ playerId, scoreId, name, email: email || null });
  return Response.json({ ok: true });
}
