import type { Metadata } from "next";
import { AboutPage } from "@/components/about/AboutPage";
import { about } from "@/content/about";
import { timeline } from "@/content/timeline";
import { getSponsors } from "@/lib/data/public";
import { validateAbout } from "@/lib/validate-about";

export const metadata: Metadata = {
  title: "About",
  alternates: { canonical: "/about" },
  description: about.header.lead,
};

/** Partners come from the admin sponsors list (spec 06 §6.7); the rest of About is still content/about.ts. */
export default async function Page() {
  const content = { ...about, partners: await getSponsors() };
  // Inside the page function: a bad save fails this regeneration and the last good page keeps being served.
  validateAbout(content, timeline);
  return <AboutPage about={content} timeline={timeline} />;
}
