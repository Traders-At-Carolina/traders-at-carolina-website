import type { ComponentProps } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { FirmField } from "@/components/team/FirmField";
import { LeadershipTier, TierHeader } from "@/components/team/LeadershipTier";
import { PlacementWall } from "@/components/team/PlacementWall";
import { Placements } from "@/components/team/Placements";
import type { CompanyMark, Placement, TeamContent } from "@/content/types";
import { coPresidents, directors, execMembers, showPlacements, sortFirms } from "@/lib/team";

type TeamPageProps = {
  team: TeamContent;
  placements: Placement[];
  /** Firms for the header strip and the § 04 firm field (content/placement-wall.ts); empty omits both. */
  wall: CompanyMark[];
};

/** Composes /team (spec 04 §2). Placements render only at 5+ firms. */
export function TeamPage({ team, placements, wall }: TeamPageProps) {
  const presidents = coPresidents(team.people);
  const board = execMembers(team.people);
  const directorList = directors(team.people);
  // Tiers with nobody in them are omitted, so § numbers stay contiguous; with no leadership at all the first tier shows an empty state.
  const noLeadership = presidents.length + board.length + directorList.length === 0;
  type Tier = Omit<ComponentProps<typeof LeadershipTier>, "index">;
  const allTiers: Tier[] = [
    {
      id: "exec-title",
      eyebrow: "Operations",
      title: "Executive Board",
      members: board,
    },
    {
      id: "presidents-title",
      eyebrow: "Leadership",
      title: "Co-Presidents",
      members: presidents,
    },
    {
      id: "directors-title",
      eyebrow: "Programs",
      title: "Directors",
      members: directorList,
    },
  ];
  const tiers = allTiers
    .filter((tier) => tier.members.length > 0)
    // The first tier on the page carries the academic-year heading.
    .map((tier, i) => (i === 0 && team.academicYear ? { ...tier, title: `Leadership, ${team.academicYear}` } : tier));
  // The firm field and Placements take the next numbers after the tiers, so § numbers stay contiguous.
  const fieldIndex = noLeadership ? 2 : tiers.length + 1;
  const showField = wall.length > 0;
  const placementsIndex = showField ? fieldIndex + 1 : fieldIndex;

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="The people running the desk."
        lead="Traders at Carolina is run by students. Meet the executive board, co-presidents and directors."
        art={wall.length > 0 ? <PlacementWall companies={wall} /> : null}
      />
      {noLeadership ? (
        <LeadershipTier
          index={1}
          id="exec-title"
          eyebrow="Operations"
          title={team.academicYear ? `Leadership, ${team.academicYear}` : "Leadership"}
          members={[]}
          emptyText="Board profiles will be posted here soon."
        />
      ) : (
        tiers.map((tier, i) => <LeadershipTier key={tier.id} index={i + 1} {...tier} />)
      )}
      {team.note ? (
        // A paragraph this long reads better left-aligned; the heading stays centered with the tiers above it.
        <Section labelledBy="team-note-title" density="compact">
          <div className="mx-auto max-w-prose border-t border-rule pt-8">
            <h2 id="team-note-title" className="text-center font-title text-h3 font-extrabold text-black">
              How the team serves the mission
            </h2>
            <p className="mt-4 text-body text-ink-2">{team.note}</p>
          </div>
        </Section>
      ) : null}
      {/* Where members have worked closes the page, after the note. The note is unnumbered, so the § numbers still
          run on from the tiers. */}
      {showField ? (
        <Section labelledBy="firm-field-title" density="compact">
          <TierHeader index={fieldIndex} eyebrow="Where we've worked" title="Where our members have worked" id="firm-field-title" />
          <FirmField companies={wall} />
        </Section>
      ) : null}
      {showPlacements(placements) ? <Placements index={placementsIndex} firms={sortFirms(placements)} /> : null}
    </>
  );
}
