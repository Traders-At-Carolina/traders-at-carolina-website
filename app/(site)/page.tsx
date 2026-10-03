import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import { about } from "@/content/about";
import { events } from "@/content/events";
import { home } from "@/content/home";
import { site } from "@/content/site";
import { resolvePartnerFirms, sortPartners } from "@/lib/about";
import { validateEvents } from "@/lib/validate-events";
import { validateHome } from "@/lib/validate-home";

validateHome(home);
validateEvents(events);

// The partner stat counts the About partner list unless set explicitly, so the two never disagree (spec 02 §5).
const content = {
  ...home,
  stats: { ...home.stats, partnerFirms: resolvePartnerFirms(home.stats.partnerFirms, about.partners) },
};

export const metadata: Metadata = {
  title: { absolute: "Traders at Carolina · Quantitative Finance at UNC" },
  alternates: { canonical: "/" },
  description: home.hero.subhead,
};

export default function Page() {
  const sponsors = sortPartners(about.partners).map(({ name, logo }) => ({ name, logo }));
  return <HomePage home={content} recruiting={site.recruiting} sponsors={sponsors} events={events} now={new Date()} />;
}
