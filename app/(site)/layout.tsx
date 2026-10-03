import { SiteChrome } from "@/components/SiteChrome";
import { getPlacements, getRecruiting } from "@/lib/data/public";

/**
 * 5-minute backstop (spec 06 §3 Scheduled changes): every public page shows the header and footer Apply, so each
 * regenerates at least this often and a scheduled opening or passed deadline lands without a save. Must be a literal.
 */
export const revalidate = 300;

/** Public pages share the site chrome; /admin (spec 06) sits outside this group. Header and footer read the admin. */
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [{ wall }, recruiting] = await Promise.all([getPlacements(), getRecruiting()]);
  return (
    <SiteChrome wall={wall} recruiting={recruiting}>
      {children}
    </SiteChrome>
  );
}
