import type { ComponentProps } from "react";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { CTABand } from "@/components/CTABand";
import { PageHeader } from "@/components/PageHeader";
import { LeadershipTier } from "@/components/team/LeadershipTier";
import { Placements } from "@/components/team/Placements";
import type { Placement, Recruiting, TeamContent } from "@/content/types";
import { getApplicationState } from "@/lib/applications";
import { homeApplyCopy } from "@/lib/home";
import { coPresidents, directors, execMembers, showPlacements, sortFirms } from "@/lib/team";

type TeamPageProps = {
  team: TeamContent;
  placements: Placement[];
  recruiting: Recruiting;
  /** Build time for the static page; injectable for tests. */
  now: Date;
};

/** Composes /team (spec 04 §2). Placements render only at 5+ firms. */
export function TeamPage({ team, placements, recruiting, now }: TeamPageProps) {
  const state = getApplicationState(now, recruiting);
  const band = homeApplyCopy(state, recruiting, now).band;
  const bandTitle = state.status === "open" ? "Want to see your name here next year?" : band.title;

  const presidents = coPresidents(team.people);
  const board = execMembers(team.people);
  const directorList = directors(team.people);
  // Tiers with nobody in them are omitted, so § numbers stay contiguous; with no leadership at all the first tier shows an empty state.
  const noLeadership = presidents.length + board.length + directorList.length === 0;
  type Tier = Omit<ComponentProps<typeof LeadershipTier>, "index">;
  const allTiers: Tier[] = [
    {
      id: "exec-title",
      eyebrow: "Executive board",
      title: "Executive Board",
      members: board,
      variant: "bold",
    },
    {
      id: "presidents-title",
      eyebrow: "Co-Presidents",
      title: "Co-Presidents",
      members: presidents,
      variant: "featured",
    },
    {
      id: "directors-title",
      eyebrow: "Directors",
      title: "Directors",
      members: directorList,
      variant: "directors",
    },
  ];
  const tiers = allTiers
    .filter((tier) => tier.members.length > 0)
    // The first tier on the page carries the academic-year heading.
    .map((tier, i) => (i === 0 && team.academicYear ? { ...tier, title: `Leadership, ${team.academicYear}` } : tier));
  const nextIndex = noLeadership ? 2 : tiers.length + 1;

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="The people running the desk."
        lead="Traders at Carolina is run by students. Meet the executive board, co-presidents and directors."
        seed={404}
      />
      {noLeadership ? (
        <LeadershipTier
          index={1}
          id="exec-title"
          eyebrow="Executive board"
          title={team.academicYear ? `Leadership, ${team.academicYear}` : "Leadership"}
          members={[]}
          emptyText="Board profiles will be posted here soon."
        />
      ) : (
        tiers.map((tier, i) => <LeadershipTier key={tier.id} index={i + 1} {...tier} />)
      )}
      {showPlacements(placements) ? <Placements index={nextIndex} firms={sortFirms(placements)} /> : null}
      {team.note ? (
        <section aria-labelledby="team-note-title" className="bg-bone py-10 md:py-12 lg:py-14">
          <Container>
            <div className="mx-auto max-w-prose border-t border-rule pt-8 text-center">
              <h2 id="team-note-title" className="font-title text-h3 font-extrabold text-black">
                How the team serves the mission
              </h2>
              <p className="mt-4 text-body text-ink-2">{team.note}</p>
            </div>
          </Container>
        </section>
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
