import { getApplyTarget } from "@/components/ApplyButton";
import { SiteHeaderClient } from "@/components/SiteHeaderClient";
import { primaryNav } from "@/content/nav";

/** Resolves the Apply target on the server, then hands off to the interactive header. */
export function SiteHeader() {
  const { href, external } = getApplyTarget();
  return <SiteHeaderClient links={primaryNav} applyHref={href} applyExternal={external} />;
}
