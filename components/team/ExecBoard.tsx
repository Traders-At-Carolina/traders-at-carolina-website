import { PersonCard } from "@/components/PersonCard";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import type { Person } from "@/content/types";

type ExecBoardProps = {
  index: number;
  academicYear?: string;
  members: Person[];
};

/** § 01 — executive board grid; an honest empty state until profiles are added (spec 04 §4.2). */
export function ExecBoard({ index, academicYear, members }: ExecBoardProps) {
  return (
    <Section labelledBy="exec-title">
      <SectionHeader
        index={index}
        eyebrow="Executive board"
        title={academicYear ? `Leadership, ${academicYear}.` : "Leadership."}
        id="exec-title"
      />
      <Reveal className="mt-12 md:mt-16">
        {members.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-12 xl:grid-cols-4">
            {members.map((person) => (
              <PersonCard key={person.slug} person={person} />
            ))}
          </div>
        ) : (
          <p className="text-body text-ink-2">Board profiles will be posted here soon.</p>
        )}
      </Reveal>
    </Section>
  );
}
