import { auth, clerkClient, verifyToken } from "@clerk/nextjs/server";

/**
 * Who is playing, for /api/games/* (spec 03 §3.7).
 *
 * Clerk's session token lasts 60 seconds and is refreshed only when a page is loaded (a GET navigation); a fetch
 * POST with an expired token is read as signed out. Public pages run no Clerk code (06 §4), so by the time a game
 * ends the token has nearly always expired. Rather than load Clerk on /membership, fall back to the cookie: if
 * Clerk signed it, and Clerk says that session is still active, it's still that user.
 */

/** Clerk's default maximum session lifetime, the oldest token worth asking about. Must be a finite number of ms. */
const STALE_TOKEN_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

/** Clerk sets `__session` and `__session_<suffix>`. Suffixed first: a plain `__session` can be left over from another Clerk app on localhost. */
function sessionTokens(request: Request): string[] {
  const found: Array<{ name: string; token: string }> = [];
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const at = part.indexOf("=");
    if (at === -1) continue;
    const name = part.slice(0, at).trim();
    const token = part.slice(at + 1).trim();
    if (token && (name === "__session" || name.startsWith("__session_"))) found.push({ name, token });
  }
  return found.sort((a, b) => Number(a.name === "__session") - Number(b.name === "__session")).map((c) => c.token);
}

/** Clerk's claims if it signed this token, however long ago it expired. verifyToken returns the claims and throws when it can't vouch for the token. */
async function signedClaims(token: string) {
  try {
    return await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      jwtKey: process.env.CLERK_JWT_KEY,
      clockSkewInMs: STALE_TOKEN_GRACE_MS,
    });
  } catch {
    return null;
  }
}

async function staleSessionUserId(request: Request): Promise<string | null> {
  for (const token of sessionTokens(request)) {
    const claims = await signedClaims(token);
    if (!claims?.sub || !claims.sid) continue;

    const session = await (await clerkClient()).sessions.getSession(claims.sid);
    return session.status === "active" && session.userId === claims.sub ? claims.sub : null;
  }
  return null;
}

/** The signed-in user's id, or null for an anonymous visitor (or a session that has ended, or if Clerk can't be reached). */
export async function sessionUserId(request: Request): Promise<string | null> {
  const { userId } = await auth();
  if (userId) return userId;

  try {
    return await staleSessionUserId(request);
  } catch {
    return null;
  }
}
