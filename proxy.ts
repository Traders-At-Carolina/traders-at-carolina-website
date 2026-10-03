import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAdmin = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);
const isAuthPage = createRouteMatcher(["/admin/sign-in(.*)", "/admin/sign-up(.*)"]);

/**
 * Clerk runs only where it's needed (spec 06 §4): /admin (protected), /account (visitor sign-in), /portal (the page
 * itself sends signed-out visitors to /account/sign-in, spec 09 §2) and /api/games (reads the session to put scores
 * on an account, spec 03 §3.7). Public pages stay static and ship no auth code.
 */
export default clerkMiddleware(
  async (auth, req) => {
    if (isAdmin(req) && !isAuthPage(req)) await auth.protect();
  },
  { signInUrl: "/admin/sign-in", signUpUrl: "/admin/sign-up" },
);

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/account/:path*", "/portal/:path*", "/api/games/:path*"],
};
