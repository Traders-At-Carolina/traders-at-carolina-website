import { PersonCard } from "@/components/PersonCard";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import { TextLink } from "@/components/TextLink";
import type { MembershipContent } from "@/content/types";
import type { TrackGroup } from "@/lib/team";

type TrackLeadsProps = {
  index: number;
  groups: TrackGroup[];
  /** Track names from content/membership.ts, so labels match the Membership page. */
  tracks: MembershipContent["tracks"];
};

/**
 * § 02 — leads grouped by track (spec 04 §4.3). Desktop: three hairline-divided columns.
 * Execs who lead a track appear once, under the board, with a "Led by" line here.
 */
export function TrackLeads({ index, groups, tracks }: TrackLeadsProps) {
  return (
    <Section labelledBy="leads-title">
      <SectionHeader
        index={index}
        eyebrow="Track leads"
        title="Your first point of contact."
        lead="Each track has a lead who runs its sessions and projects."
        id="leads-title"
      />
      <Reveal className="mt-12 grid grid-cols-1 divide-y divide-rule md:mt-16 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {groups.map((group) => {
          const name = tracks.find((t) => t.id === group.track)?.name ?? group.track;
          const empty = group.leads.length === 0 && group.execLeads.length === 0;
          return (
            <div key={group.track} className="py-10 first:pt-0 last:pb-0 lg:px-8 lg:py-0 lg:first:pl-0 lg:last:pr-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <p className="eyebrow">{name}</p>
                <TextLink href={`/membership#${group.track}`} arrow className="text-caption">
                  About the track
                </TextLink>
              </div>
              {group.leads.length > 0 ? (
                <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-1">
                  {group.leads.map((person) => (
                    <PersonCard key={person.slug} person={person} />
                  ))}
                </div>
              ) : null}
              {group.execLeads.map((person) => (
                <p key={person.slug} className="mt-6 text-body">
                  <TextLink href={`#${person.slug}`} arrow>
                    Led by {person.name}, {person.role}
                  </TextLink>
                </p>
              ))}
              {empty ? <p className="mt-6 text-caption text-ink-3">Lead to be announced.</p> : null}
            </div>
          );
        })}
      </Reveal>
    </Section>
  );
}
