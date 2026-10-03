import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal",
  robots: { index: false, follow: false },
};

/**
 * Clerk loads here for the portal's account menu, as under /admin and /account; the rest of the site never loads it
 * (spec 09 §2). No auth check: the page calls requireViewer() itself.
 */
export default function PortalLayout({ children }: LayoutProps<"/portal">) {
  return (
    <ClerkProvider signInUrl="/account/sign-in" signUpUrl="/account/sign-up" afterSignOutUrl="/">
      {children}
    </ClerkProvider>
  );
}
