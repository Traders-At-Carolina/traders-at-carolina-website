import { PersonCard } from "@/components/PersonCard";
import { Reveal } from "@/components/Reveal";
import { Eyebrow } from "@/components/Eyebrow";
import { Section } from "@/components/Section";
import type { Person } from "@/content/types";

export type TierVariant = "default" | "bold" | "featured" | "directors";

type LeadershipTierProps = {
  index: number;
  eyebrow: string;
  title: string;
  id: string;
  members: Person[];
  /**
   * bold: executive board, heavy black type.
   * featured: wider two-up (co-presidents).
   * directors: square headshots with the role leading.
   */
  variant?: TierVariant;
  emptyText?: string;
};

/** Centered, wrapping rows of fixed-width cards, so headshots stay modest and every row centers. */
const ROW = "flex flex-wrap justify-center gap-x-6 gap-y-10 md:gap-x-10 md:gap-y-12";
const CARD: Record<TierVariant, string> = {
  default: "w-40 sm:w-48",
  bold: "w-40 sm:w-48",
  featured: "w-44 sm:w-56",
  directors: "w-40 sm:w-48",
};

/** One tier of the leadership hierarchy (executive board, co-presidents, directors). */
export function LeadershipTier({ index, eyebrow, title, id, members, variant = "default", emptyText }: LeadershipTierProps) {
  if (members.length === 0 && !emptyText) return null;
  return (
    <Section labelledBy={id} className="!py-10 md:!py-12 lg:!py-14">
      <header className="border-t border-rule pt-6 text-center md:pt-8">
        <Eyebrow index={index} className="!normal-case !tracking-[0.04em]">
          {eyebrow}
        </Eyebrow>
        <h2 id={id} className="mt-4 font-title text-h2 font-extrabold text-black">
          {title}
        </h2>
      </header>
      <Reveal className="mt-8 md:mt-10">
        {members.length > 0 ? (
          <div className={ROW}>
            {members.map((person) => (
              <div key={person.slug} className={CARD[variant]}>
                <PersonCard
                  person={person}
                  shape={variant === "directors" ? "square" : "portrait"}
                  emphasis={variant === "bold" ? "bold" : variant === "directors" ? "role" : "default"}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body text-ink-2">{emptyText}</p>
        )}
      </Reveal>
    </Section>
  );
}
