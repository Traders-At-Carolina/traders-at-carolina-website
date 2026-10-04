import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// The console's own typeface (spec 11 §2.2); loaded only under /admin.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

/** Clerk's cards and account menu in the console's colours (spec 11 §2.4). */
const clerkAppearance = {
  variables: {
    colorPrimary: "#1d6fb8",
    colorForeground: "#0f172a",
    colorMutedForeground: "#475569",
    colorBackground: "#ffffff",
    colorInput: "#ffffff",
    colorBorder: "#e2e8f0",
    colorDanger: "#b91c1c",
    colorSuccess: "#15803d",
    colorWarning: "#b45309",
    fontFamily: inter.style.fontFamily,
    borderRadius: "8px",
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
      <div className={`${inter.variable} admin-ui flex flex-1 flex-col`}>{children}</div>
    </ClerkProvider>
  );
}
