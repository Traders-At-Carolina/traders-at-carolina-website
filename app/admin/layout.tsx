import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** Clerk loads only here and under /account, never on public pages (spec 06 §4). No auth check: each page calls requirePage(). */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <ClerkProvider signInUrl="/admin/sign-in" signUpUrl="/admin/sign-up" afterSignOutUrl="/">
      {children}
    </ClerkProvider>
  );
}
