import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { MarkInternalBrowser } from "@/components/admin/MarkInternalBrowser";

/**
 * Console shell: nav and account menu. No auth check here; every page calls requirePage() (Next 16 auth guide).
 * Marks the browser as internal only here, so merely opening /admin/sign-in doesn't drop a visitor from analytics.
 */
export default function ConsoleLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 md:flex-row md:gap-12 md:px-8 md:py-12">
      <MarkInternalBrowser />
      <aside className="flex shrink-0 flex-col gap-6 md:w-48">
        <div className="flex items-center justify-between gap-4">
          <Link href="/admin" className="font-display text-h3 text-black">
            Admin
          </Link>
          <UserButton />
        </div>
        <AdminNav />
        <Link href="/" className="link-underline text-caption text-navy">
          View the site
        </Link>
      </aside>
      <main id="main" className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
