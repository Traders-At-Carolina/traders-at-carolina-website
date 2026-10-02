import { MissionVision } from "@/components/about/MissionVision";
import { OurStory } from "@/components/about/OurStory";
import { PartnersAdvisors } from "@/components/about/PartnersAdvisors";
import { Principles } from "@/components/about/Principles";
import { Button } from "@/components/Button";
import { CTABand } from "@/components/CTABand";
import { PageHeader } from "@/components/PageHeader";
import type { AboutContent, Recruiting, TimelineEntry } from "@/content/types";
import { aboutSectionKeys } from "@/lib/about";
import { getApplicationState } from "@/lib/applications";
import { homeApplyCopy, numberSections } from "@/lib/home";

type AboutPageProps = {
  about: AboutContent;
  timeline: TimelineEntry[];
  recruiting: Recruiting;
  /** Build time for the static page; injectable for tests. */
  now: Date;
};

/** Composes /about (spec 02 §2). Story and partners render only with real content; numbering stays sequential. */
export function AboutPage({ about, timeline, recruiting, now }: AboutPageProps) {
  const state = getApplicationState(now, recruiting);
  const band = homeApplyCopy(state, recruiting, now).band;
  const bandTitle = state.status === "open" ? "Want to be part of the next chapter?" : band.title;

  const keys = aboutSectionKeys(about, timeline);
  const n = numberSections(keys);

  return (
    <>
      <PageHeader eyebrow="About" title={about.header.h1} lead={about.header.lead} seed={202} trend="up" />
      <MissionVision index={n.mission} title={about.headings.mission} mission={about.mission} vision={about.vision} />
      {keys.includes("story") ? (
        <OurStory index={n.story} title={about.headings.story} story={about.story} timeline={timeline} />
      ) : null}
      <Principles index={n.principles} title={about.headings.principles} principles={about.principles} />
      {keys.includes("partners") ? (
        <PartnersAdvisors index={n.partners} headings={about.headings} partners={about.partners} advisors={about.advisors} />
      ) : null}
      <CTABand
        title={bandTitle}
        action={
          <Button href={band.href} external={band.external} variant="inverse">
            {band.label}
          </Button>
        }
      />
    </>
  );
}
