import { PersonCard } from "@/components/PersonCard";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import type { Person } from "@/content/types";

type LeadershipTierProps = {
  index: number;
  eyebrow: string;
  title: string;
  lead?: string;
  id: string;
  members: Person[];
  /** Co-presidents get a wider two-up layout; other tiers use the standard grid. */
  featured?: boolean;
  emptyText?: string;
};

/** One tier of the leadership hierarchy (co-presidents, executive board, directors). */
export function LeadershipTier({ index, eyebrow, title, lead, id, members, featured = false, emptyText }: LeadershipTierProps) {
  if (members.length === 0 && !emptyText) return null;
  return (
    <Section labelledBy={id}>
      <SectionHeader index={index} eyebrow={eyebrow} title={title} lead={lead} id={id} />
      <Reveal className="mt-12 md:mt-16">
        {members.length > 0 ? (
          <div
            className={
              featured
                ? "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:max-w-3xl"
                : "grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-12 xl:grid-cols-4"
            }
          >
            {members.map((person) => (
              <PersonCard key={person.slug} person={person} />
            ))}
          </div>
        ) : (
          <p className="text-body text-ink-2">{emptyText}</p>
        )}
      </Reveal>
    </Section>
  );
}
