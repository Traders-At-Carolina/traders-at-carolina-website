import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import { about } from "@/content/about";
import { home } from "@/content/home";
import { site } from "@/content/site";
import { resolvePartnerFirms } from "@/lib/about";
import { validateHome } from "@/lib/validate-home";

validateHome(home);

// The partner stat counts the About partner list unless set explicitly, so the two never disagree (spec 02 §5).
const content = {
  ...home,
  stats: { ...home.stats, partnerFirms: resolvePartnerFirms(home.stats.partnerFirms, about.partners) },
};

export const metadata: Metadata = {
  title: { absolute: "Traders at Carolina · Quantitative Finance at UNC" },
  description: home.hero.subhead,
};

export default function Page() {
  return <HomePage home={content} recruiting={site.recruiting} now={new Date()} />;
}
