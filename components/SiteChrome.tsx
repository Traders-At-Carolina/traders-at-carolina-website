import type { ReactNode } from "react";
import { site } from "@/content/site";
import type { CompanyMark, Recruiting } from "@/content/types";
import { PortalButton } from "@/components/PortalButton";
import { SectionProgress } from "@/components/SectionProgress";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

/** Skip link, header, main landmark and footer around every public page (00 §10, §12). /admin has its own shell (spec 06). */
export function SiteChrome({
  children,
  wall,
  recruiting,
}: {
  children: ReactNode;
  /** Footer placement strip (spec 06 §6.8); defaults to content. */
  wall?: CompanyMark[];
  /** Recruiting settings for the header and footer Apply (spec 06 §6.5); defaults to content. */
  recruiting?: Recruiting;
}) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader recruiting={recruiting} />
      <SectionProgress />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <SiteFooter wall={wall} settings={recruiting ? { ...site, recruiting } : undefined} />
      <PortalButton />
    </>
  );
}
