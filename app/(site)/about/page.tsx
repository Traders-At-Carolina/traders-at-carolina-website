import type { Metadata } from "next";
import { AboutPage } from "@/components/about/AboutPage";
import { about } from "@/content/about";
import { timeline } from "@/content/timeline";
import { validateAbout } from "@/lib/validate-about";

validateAbout(about, timeline);

export const metadata: Metadata = {
  title: "About",
  alternates: { canonical: "/about" },
  description: about.header.lead,
};

export default function Page() {
  return <AboutPage about={about} timeline={timeline} />;
}
