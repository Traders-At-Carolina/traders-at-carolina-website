import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** Clerk's cards and account menu in the console's colours, the `ui-*` tokens in globals.css (spec 11 §2.4). */
const clerkAppearance = {
  variables: {
    colorPrimary: "#233265",
    colorForeground: "#000000",
    colorMutedForeground: "#474644",
    colorBackground: "#ffffff",
    colorInput: "#ffffff",
    colorBorder: "#d6d5cf",
    colorDanger: "#9b2c22",
    colorSuccess: "#3d6b35",
    colorWarning: "#8a5a12",
    fontFamily: "var(--font-public-sans), system-ui, sans-serif",
    borderRadius: "2px",
  },
};

/**
 * Clerk loads only here and under /account, never on public pages (spec 06 §4). Everything under /admin renders inside
 * `.admin-ui`, which swaps the public base styles for the console's (spec 11 §2.3). No auth check: each page calls
 * requirePage().
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <ClerkProvider signInUrl="/admin/sign-in" signUpUrl="/admin/sign-up" afterSignOutUrl="/" appearance={clerkAppearance}>
      <div className="admin-ui flex flex-1 flex-col">{children}</div>
    </ClerkProvider>
  );
}
