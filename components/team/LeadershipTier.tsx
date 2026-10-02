import { PersonCard } from "@/components/PersonCard";
import { Reveal } from "@/components/Reveal";
import { Eyebrow } from "@/components/Eyebrow";
import { Section } from "@/components/Section";
import type { Person } from "@/content/types";

/** featured: larger cards from 640px up, for the co-presidents. */
export type TierVariant = "default" | "featured";

type LeadershipTierProps = {
  index: number;
  eyebrow: string;
  title: string;
  id: string;
  members: Person[];
  variant?: TierVariant;
  emptyText?: string;
};

/**
 * Phones: a two-up grid, with an odd last card centered. From 640px: centered, wrapping rows of
 * fixed-width cards, so headshots stay modest and every row centers.
 */
const ROW = "grid grid-cols-2 gap-x-4 gap-y-8 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-12 sm:gap-y-12";
const LONE = "[&:nth-child(odd):last-child]:col-span-2 [&:nth-child(odd):last-child]:mx-auto [&:nth-child(odd):last-child]:w-[calc(50%-0.5rem)]";
const CARD = {
  default: { width: "sm:w-48 sm:[&:nth-child(odd):last-child]:w-48", sizes: "(min-width: 640px) 192px, 50vw" },
  featured: { width: "sm:w-56 md:w-64 sm:[&:nth-child(odd):last-child]:w-56 md:[&:nth-child(odd):last-child]:w-64", sizes: "(min-width: 768px) 256px, (min-width: 640px) 224px, 50vw" },
} as const;

/** One tier of the leadership hierarchy (executive board, co-presidents, directors). */
export function LeadershipTier({ index, eyebrow, title, id, members, variant = "default", emptyText }: LeadershipTierProps) {
  if (members.length === 0 && !emptyText) return null;
  const card = CARD[variant];
  return (
    <Section labelledBy={id} density="compact">
      <header className="border-t border-rule pt-6 text-center md:pt-8">
        <Eyebrow index={index} className="!normal-case !tracking-[0.04em]">
          {eyebrow}
        </Eyebrow>
        <h2 id={id} className="mt-4 font-title text-h2 font-extrabold text-black">
          {title}
        </h2>
      </header>
      <Reveal className="mt-8 md:mt-12">
        {members.length > 0 ? (
          <div className={ROW}>
            {members.map((person) => (
              <div key={person.slug} className={`w-full ${LONE} ${card.width}`}>
                <PersonCard person={person} sizes={card.sizes} />
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
