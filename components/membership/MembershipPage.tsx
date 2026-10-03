import { Activities } from "@/components/membership/Activities";
import { DepthChart } from "@/components/membership/DepthChart";
import { Expectations } from "@/components/membership/Expectations";
import { Games } from "@/components/membership/Games";
import { HowItWorks } from "@/components/membership/HowItWorks";
import { PhotoBand } from "@/components/membership/PhotoBand";
import { Tracks } from "@/components/membership/Tracks";
import { PageHeader } from "@/components/PageHeader";
import type { MembershipContent, Recruiting } from "@/content/types";
import { numberSections } from "@/lib/home";
import { showExpectations } from "@/lib/membership";

type MembershipPageProps = {
  membership: MembershipContent;
  /** slug → name for track leads (content/team.ts). */
  leadNames: Record<string, string>;
  /** Recruiting for the games' Apply button (spec 06 §6.5). */
  recruiting?: Recruiting;
};

type SectionKey = "how" | "tracks" | "games" | "expectations" | "activities";

/**
 * Composes /membership (spec 03 §2). The games follow Tracks, while the sample problems are fresh in mind.
 * Expectations sits before Activities so the graphite section never stacks directly on the footer's navy CTA zone,
 * and it appears only once it can answer more than prerequisites (which the Tracks lead already covers).
 * Numbering stays sequential.
 */
export function MembershipPage({ membership, leadNames, recruiting }: MembershipPageProps) {
  const { headings } = membership;

  const withExpectations = showExpectations(membership.expectations);
  const keys: SectionKey[] = withExpectations
    ? ["how", "tracks", "games", "expectations", "activities"]
    : ["how", "tracks", "games", "activities"];
  const n = numberSections(keys);
  const [wide, ...pair] = membership.photos ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Membership"
        title={membership.header.h1}
        lead={membership.header.lead}
        art={<DepthChart seed={303} className="h-48 w-full lg:h-56" />}
      />
      <HowItWorks index={n.how} title={headings.how} steps={membership.steps} switchingPolicy={membership.switchingPolicy} />
      {wide ? <PhotoBand photos={[wide]} /> : null}
      <Tracks index={n.tracks} title={headings.tracks} tracks={membership.tracks} leadNames={leadNames} />
      <Games index={n.games} title={headings.games} recruiting={recruiting} />
      {withExpectations ? (
        <Expectations index={n.expectations} title={headings.expectations} expectations={membership.expectations} />
      ) : null}
      <Activities index={n.activities} title={headings.activities} activities={membership.activities} tracks={membership.tracks} />
      {pair.length === 2 ? <PhotoBand photos={pair} /> : null}
    </>
  );
}
