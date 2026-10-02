import type { Metadata } from "next";
import { AboutPage } from "@/components/about/AboutPage";
import { about } from "@/content/about";
import { site } from "@/content/site";
import { timeline } from "@/content/timeline";
import { validateAbout } from "@/lib/validate-about";

validateAbout(about, timeline);

export const metadata: Metadata = {
  title: "About",
  description: about.header.lead,
};

export default function Page() {
  return <AboutPage about={about} timeline={timeline} recruiting={site.recruiting} now={new Date()} />;
}
