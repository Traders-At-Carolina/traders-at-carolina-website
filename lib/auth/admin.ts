import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { isAdminClaims } from "@/lib/auth/roles";

export const SIGN_IN_PATH = "/admin/sign-in";

/**
 * Gate for /admin pages: signed-out visitors go to sign-in, signed-in non-admins get a 404.
 * Pages call this themselves; layouts never check auth (Next 16 authentication guide).
 */
export async function requirePage(): Promise<{ userId: string }> {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect(SIGN_IN_PATH);
  if (!isAdminClaims(sessionClaims)) notFound();
  return { userId };
}
