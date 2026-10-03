import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import { home } from "@/content/home";
import { resolvePartnerFirms, sortPartners } from "@/lib/about";
import { getEvents, getHomePhotos, getMemberCount, getRecruiting, getSponsors } from "@/lib/data/public";
import { validateEvents } from "@/lib/validate-events";
import { validateHome } from "@/lib/validate-home";

export const metadata: Metadata = {
  title: { absolute: "Traders at Carolina · Quantitative Finance at UNC" },
  alternates: { canonical: "/" },
  description: home.hero.subhead,
};

/**
 * Photos, sponsors, recruiting, the member count and the Upcoming event come from the admin (spec 06 §6.5–6.7, §6.10);
 * the rest of Home is still content/home.ts. Regenerates at least every 5 minutes (layout), so Upcoming drops off
 * when an event ends.
 */
export default async function Page() {
  const [photos, partners, recruiting, members, events] = await Promise.all([getHomePhotos(), getSponsors(), getRecruiting(), getMemberCount(), getEvents()]);
  // The partner stat counts the About partner list unless set explicitly, so the two never disagree (spec 02 §5).
  const content = {
    ...home,
    photos,
    stats: { ...home.stats, members, partnerFirms: resolvePartnerFirms(home.stats.partnerFirms, partners) },
  };
  // Inside the page function: a bad save fails this regeneration and the last good page keeps being served.
  validateHome(content);
  validateEvents(events);
  const sponsors = sortPartners(partners).map(({ name, logo }) => ({ name, logo }));
  return <HomePage home={content} recruiting={recruiting} sponsors={sponsors} events={events} now={new Date()} />;
}
