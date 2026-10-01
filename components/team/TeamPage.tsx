import { Button } from "@/components/Button";
import { CTABand } from "@/components/CTABand";
import { PageHeader } from "@/components/PageHeader";
import { LeadershipTier } from "@/components/team/LeadershipTier";
import { Placements } from "@/components/team/Placements";
import { TrackLeads } from "@/components/team/TrackLeads";
import type { MembershipContent, Placement, Recruiting, TeamContent } from "@/content/types";
import { getApplicationState } from "@/lib/applications";
import { homeApplyCopy } from "@/lib/home";
import { coPresidents, directors, execMembers, showPlacements, sortFirms, trackGroups } from "@/lib/team";

type TeamPageProps = {
  team: TeamContent;
  placements: Placement[];
  tracks: MembershipContent["tracks"];
  recruiting: Recruiting;
  /** Build time for the static page; injectable for tests. */
  now: Date;
};

/** Composes /team (spec 04 §2). Placements render only at 5+ firms. */
export function TeamPage({ team, placements, tracks, recruiting, now }: TeamPageProps) {
  const state = getApplicationState(now, recruiting);
  const band = homeApplyCopy(state, recruiting, now).band;
  const bandTitle = state.status === "open" ? "Want to see your name here next year?" : band.title;

  const presidents = coPresidents(team.people);
  const board = execMembers(team.people);
  const directorList = directors(team.people);
  // Tiers with nobody in them are omitted, so § numbers stay contiguous; with no leadership at all the first tier shows an empty state.
  const noLeadership = presidents.length + board.length + directorList.length === 0;
  const tiers = [
    {
      id: "presidents-title",
      eyebrow: "Co-Presidents",
      title: "Co-Presidents.",
      lead: "The two students who set the club's direction, one for the trading side and one for the tech side.",
      members: presidents,
      featured: true,
    },
    {
      id: "exec-title",
      eyebrow: "Executive board",
      title: "The executive board.",
      members: board,
    },
    {
      id: "directors-title",
      eyebrow: "Directors",
      title: "Directors.",
      lead: "Each director owns a function that keeps the club running: technology, education and industry relations.",
      members: directorList,
    },
  ]
    .filter((tier) => tier.members.length > 0)
    // The first tier on the page carries the academic-year heading.
    .map((tier, i) => (i === 0 && team.academicYear ? { ...tier, title: `Leadership, ${team.academicYear}.` } : tier));
  const nextIndex = tiers.length + 1;

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="The people running the desk."
        lead="Traders at Carolina is run by students. Meet the executive board and the leads for each track."
        seed={404}
      />
      {noLeadership ? (
        <LeadershipTier
          index={1}
          id="exec-title"
          eyebrow="Executive board"
          title={team.academicYear ? `Leadership, ${team.academicYear}.` : "Leadership."}
          members={[]}
          emptyText="Board profiles will be posted here soon."
        />
      ) : (
        tiers.map((tier, i) => <LeadershipTier key={tier.id} index={i + 1} {...tier} />)
      )}
      <TrackLeads index={noLeadership ? 2 : nextIndex} groups={trackGroups(team.people)} tracks={tracks} />
      {showPlacements(placements) ? <Placements index={(noLeadership ? 2 : nextIndex) + 1} firms={sortFirms(placements)} /> : null}
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
