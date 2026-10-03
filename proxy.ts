import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAuthPage = createRouteMatcher(["/admin/sign-in(.*)", "/admin/sign-up(.*)"]);

/** Clerk runs only under /admin (spec 06 §4); public pages stay static and ship no auth code. */
export default clerkMiddleware(
  async (auth, req) => {
    if (!isAuthPage(req)) await auth.protect();
  },
  { signInUrl: "/admin/sign-in", signUpUrl: "/admin/sign-up" },
);

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
