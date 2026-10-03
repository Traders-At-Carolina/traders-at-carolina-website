import { getApplyTarget } from "@/components/ApplyButton";
import { SiteHeaderClient } from "@/components/SiteHeaderClient";
import { primaryNav } from "@/content/nav";
import type { Recruiting } from "@/content/types";

/** Resolves the Apply target on the server, then hands off to the interactive header. */
export function SiteHeader({ recruiting }: { recruiting?: Recruiting }) {
  const { href, external, state } = getApplyTarget(new Date(), recruiting);
  const deadline = state.status === "open" ? state.deadline?.toISOString() : undefined;
  return <SiteHeaderClient links={primaryNav} applyHref={href} applyExternal={external} applyDeadline={deadline} />;
}
