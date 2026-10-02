import { SiteChrome } from "@/components/SiteChrome";

/** Public pages share the site chrome; /admin (spec 06) sits outside this group. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <SiteChrome>{children}</SiteChrome>;
}
