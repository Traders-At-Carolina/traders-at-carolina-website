import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import { about } from "@/content/about";
import { events } from "@/content/events";
import { home } from "@/content/home";
import { site } from "@/content/site";
import { resolvePartnerFirms, sortPartners } from "@/lib/about";
import { getHomePhotos } from "@/lib/data/public";
import { validateEvents } from "@/lib/validate-events";
import { validateHome } from "@/lib/validate-home";

// Events are still content/events.ts until phase 6 moves them to the database, so they validate at build time.
validateEvents(events);

export const metadata: Metadata = {
  title: { absolute: "Traders at Carolina · Quantitative Finance at UNC" },
  alternates: { canonical: "/" },
  description: home.hero.subhead,
};

/** Photos come from the admin photo library (spec 06 §6.6); the rest of Home is still content/home.ts. */
export default async function Page() {
  // The partner stat counts the About partner list unless set explicitly, so the two never disagree (spec 02 §5).
  const content = {
    ...home,
    photos: await getHomePhotos(),
    stats: { ...home.stats, partnerFirms: resolvePartnerFirms(home.stats.partnerFirms, about.partners) },
  };
  // Inside the page function: a bad save fails this regeneration and the last good page keeps being served.
  validateHome(content);
  const sponsors = sortPartners(about.partners).map(({ name, logo }) => ({ name, logo }));
  return <HomePage home={content} recruiting={site.recruiting} sponsors={sponsors} events={events} now={new Date()} />;
}
