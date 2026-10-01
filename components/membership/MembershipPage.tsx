import { Button } from "@/components/Button";
import { CTABand } from "@/components/CTABand";
import { Activities } from "@/components/membership/Activities";
import { Expectations } from "@/components/membership/Expectations";
import { HowItWorks } from "@/components/membership/HowItWorks";
import { Tracks } from "@/components/membership/Tracks";
import { PageHeader } from "@/components/PageHeader";
import type { MembershipContent, Recruiting } from "@/content/types";
import { getApplicationState } from "@/lib/applications";
import { homeApplyCopy } from "@/lib/home";

type MembershipPageProps = {
  membership: MembershipContent;
  /** slug → name for track leads (content/team.ts). */
  leadNames: Record<string, string>;
  recruiting: Recruiting;
  /** Build time for the static page; injectable for tests. */
  now: Date;
};

/** Composes /membership (spec 03 §2). */
export function MembershipPage({ membership, leadNames, recruiting, now }: MembershipPageProps) {
  const state = getApplicationState(now, recruiting);
  const band = homeApplyCopy(state, recruiting, now).band;
  const bandTitle = state.status === "open" ? "Found your track?" : band.title;
  const { headings } = membership;

  return (
    <>
      <PageHeader eyebrow="Membership" title={membership.header.h1} lead={membership.header.lead} seed={303} />
      <HowItWorks index={1} title={headings.how} steps={membership.steps} switchingPolicy={membership.switchingPolicy} />
      <Tracks index={2} title={headings.tracks} tracks={membership.tracks} leadNames={leadNames} />
      <Activities index={3} title={headings.activities} activities={membership.activities} tracks={membership.tracks} />
      <Expectations index={4} title={headings.expectations} expectations={membership.expectations} />
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
