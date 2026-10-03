import type { ReactNode } from "react";
import { PortalButton } from "@/components/PortalButton";
import { SectionProgress } from "@/components/SectionProgress";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

/** Skip link, header, main landmark and footer around every public page (00 §10, §12). /admin has its own shell (spec 06). */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <SectionProgress />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <SiteFooter />
      <PortalButton />
    </>
  );
}
