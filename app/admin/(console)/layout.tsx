import { AdminSubNav, AdminTopBar } from "@/components/admin/AdminTopBar";
import { MarkInternalBrowser } from "@/components/admin/MarkInternalBrowser";

/**
 * Console shell (spec 11 §3): top bar with the five sections, the active section's sub-tabs, then the page. No auth
 * check here; every page calls requirePage() (Next 16 auth guide). Marks the browser as internal only here, so merely
 * opening /admin/sign-in doesn't drop a visitor from analytics.
 */
export default function ConsoleLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <MarkInternalBrowser />
      <a href="#main" className="sr-only z-50 rounded-ui-md bg-ui-surface px-3 py-2 text-ui-base font-medium text-ui-accent shadow-ui-pop focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <AdminTopBar />
      <AdminSubNav />
      <main id="main" className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </>
  );
}
