import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

/**
 * Visitor sign-in for keeping game scores (spec 03 §3.7). Clerk loads here and under /admin only, never on
 * public pages (spec 06 §4).
 */
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <ClerkProvider signInUrl="/account/sign-in" signUpUrl="/account/sign-up" afterSignOutUrl="/membership#games">
      {children}
    </ClerkProvider>
  );
}
