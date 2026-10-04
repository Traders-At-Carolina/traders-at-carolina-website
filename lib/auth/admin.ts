import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { isAdminAccount } from "@/lib/auth/roles";

export const SIGN_IN_PATH = "/admin/sign-in";

/**
 * Gate for /admin pages: signed-out visitors go to sign-in, signed-in non-admins get a 404.
 * Pages call this themselves; layouts never check auth (Next 16 authentication guide).
 */
export async function requirePage(): Promise<{ userId: string }> {
  const { userId } = await auth();
  if (!userId) redirect(SIGN_IN_PATH);
  if (!(await isAdminUserId())) notFound();
  return { userId };
}

/** True when the signed-in user is an admin (see isAdminAccount). Checks the live Clerk user, not the session token. */
async function isAdminUserId(): Promise<boolean> {
  const user = await currentUser();
  return user !== null && isAdminAccount(user);
}

/** Thrown by requireAdmin(); route handlers turn it into a 401. */
export class AdminAccessError extends Error {
  constructor() {
    super("Admins only");
    this.name = "AdminAccessError";
  }
}

/**
 * Gate for server actions and /api/admin handlers (spec 06 §4). The proxy already protects /admin, but Server Functions
 * are POSTs that can be replayed against any route, so every write checks again here.
 */
export async function requireAdmin(): Promise<{ userId: string }> {
  const { userId } = await auth();
  if (!userId || !(await isAdminUserId())) throw new AdminAccessError();
  return { userId };
}
