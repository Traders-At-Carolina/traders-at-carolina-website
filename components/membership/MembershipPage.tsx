import { Button } from "@/components/Button";
import { CTABand } from "@/components/CTABand";
import { Activities } from "@/components/membership/Activities";
import { DepthChart } from "@/components/membership/DepthChart";
import { Expectations } from "@/components/membership/Expectations";
import { HowItWorks } from "@/components/membership/HowItWorks";
import { Tracks } from "@/components/membership/Tracks";
import { PageHeader } from "@/components/PageHeader";
import type { MembershipContent, Recruiting } from "@/content/types";
import { ctaFromLabel } from "@/lib/analytics/attributes";
import { getApplicationState } from "@/lib/applications";
import { homeApplyCopy, numberSections } from "@/lib/home";
import { showExpectations } from "@/lib/membership";

type MembershipPageProps = {
  membership: MembershipContent;
  /** slug → name for track leads (content/team.ts). */
  leadNames: Record<string, string>;
  recruiting: Recruiting;
  /** Build time for the static page; injectable for tests. */
  now: Date;
};

type SectionKey = "how" | "tracks" | "expectations" | "activities";

/**
 * Composes /membership (spec 03 §2). Expectations sits before Activities so the graphite section never
 * stacks directly on the navy band, and it appears only once it can answer more than prerequisites
 * (which the Tracks lead already covers). Numbering stays sequential.
 */
export function MembershipPage({ membership, leadNames, recruiting, now }: MembershipPageProps) {
  const state = getApplicationState(now, recruiting);
  const band = homeApplyCopy(state, recruiting, now).band;
  const closedLead = state.status === "closed" ? `Applications are closed for now. ${band.lead ?? ""}`.trim() : band.lead;
  const { headings } = membership;

  const withExpectations = showExpectations(membership.expectations);
  const keys: SectionKey[] = withExpectations ? ["how", "tracks", "expectations", "activities"] : ["how", "tracks", "activities"];
  const n = numberSections(keys);

  return (
    <>
      <PageHeader
        eyebrow="Membership"
        title={membership.header.h1}
        lead={membership.header.lead}
        art={<DepthChart seed={303} className="h-48 w-full lg:h-56" />}
      />
      <HowItWorks index={n.how} title={headings.how} steps={membership.steps} switchingPolicy={membership.switchingPolicy} />
      <Tracks index={n.tracks} title={headings.tracks} tracks={membership.tracks} leadNames={leadNames} />
      {withExpectations ? (
        <Expectations index={n.expectations} title={headings.expectations} expectations={membership.expectations} />
      ) : null}
      <Activities index={n.activities} title={headings.activities} activities={membership.activities} tracks={membership.tracks} />
      <CTABand
        title="Found your track?"
        lead={closedLead}
        action={
          <Button href={band.href} external={band.external} arrow={band.arrow} variant="inverse" track={{ cta: ctaFromLabel(band.label), placement: "band" }}>
            {band.label}
          </Button>
        }
      />
    </>
  );
}
