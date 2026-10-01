import { Button } from "@/components/Button";
import { CTABand } from "@/components/CTABand";
import { PageHeader } from "@/components/PageHeader";
import { ExecBoard } from "@/components/team/ExecBoard";
import { Placements } from "@/components/team/Placements";
import { TrackLeads } from "@/components/team/TrackLeads";
import type { MembershipContent, Placement, Recruiting, TeamContent } from "@/content/types";
import { getApplicationState } from "@/lib/applications";
import { homeApplyCopy } from "@/lib/home";
import { execMembers, showPlacements, sortFirms, trackGroups } from "@/lib/team";

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

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="The people running the desk."
        lead="Traders at Carolina is run by students. Meet the executive board and the leads for each track."
        seed={404}
      />
      <ExecBoard index={1} academicYear={team.academicYear} members={execMembers(team.people)} />
      <TrackLeads index={2} groups={trackGroups(team.people)} tracks={tracks} />
      {showPlacements(placements) ? <Placements index={3} firms={sortFirms(placements)} /> : null}
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
