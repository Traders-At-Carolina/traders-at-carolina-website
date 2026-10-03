import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { MarkInternalBrowser } from "@/components/admin/MarkInternalBrowser";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** Clerk loads only here, never on public pages (spec 06 §4). No auth check: each page calls requirePage(). */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <ClerkProvider signInUrl="/admin/sign-in" signUpUrl="/admin/sign-up" afterSignOutUrl="/">
      <MarkInternalBrowser />
      {children}
    </ClerkProvider>
  );
}
