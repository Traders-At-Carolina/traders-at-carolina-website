import { SiteChrome } from "@/components/SiteChrome";
import { getPlacements } from "@/lib/data/public";

/** Public pages share the site chrome; /admin (spec 06) sits outside this group. The footer strip reads placements. */
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const { wall } = await getPlacements();
  return <SiteChrome wall={wall}>{children}</SiteChrome>;
}
