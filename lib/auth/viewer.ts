import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdminAccount } from "@/lib/auth/roles";
import { getMembership } from "@/lib/members/resolve";

/** Where signed-out visitors go; Clerk sends them back to the portal afterwards (spec 09 §2). */
export const PORTAL_SIGN_IN_HREF = `/account/sign-in?redirect_url=${encodeURIComponent("/portal")}`;

/** What the portal needs to know about whoever is signed in. Never the full Clerk user, which holds private metadata. */
export type Viewer = { userId: string; firstName: string | null; isMember: boolean; isAdmin: boolean };

/**
 * The signed-in viewer, or null when signed out. For route handlers that answer signed-out requests themselves (the
 * portal file route); pages use requireViewer().
 */
export async function getViewer(): Promise<Viewer | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  if (!user) return null;
  const isAdmin = isAdminAccount(user);
  const verifiedEmails = user.emailAddresses.filter((e) => e.verification?.status === "verified").map((e) => e.emailAddress);
  const membership = await getMembership({ id: userId, verifiedEmails });
  return { userId, firstName: user.firstName?.trim() || null, isMember: isAdmin || membership !== null, isAdmin };
}

/**
 * Gate for /portal: signed-out visitors go to sign-in and come back. Admins are checked like requirePage();
 * membership comes from the roster by verified email (spec 06 §8), never from Clerk metadata.
 * Pages and server actions call this themselves; layouts never check auth (Next 16 authentication guide).
 */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(PORTAL_SIGN_IN_HREF);
  return viewer;
}
