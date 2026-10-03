import { PersonCard } from "@/components/PersonCard";
import { Reveal } from "@/components/Reveal";
import { Eyebrow } from "@/components/Eyebrow";
import { Section } from "@/components/Section";
import type { Person } from "@/content/types";

type LeadershipTierProps = {
  index: number;
  eyebrow: string;
  title: string;
  id: string;
  members: Person[];
  emptyText?: string;
};

/**
 * Phones: a two-up grid, with an odd last card centered. From 640px: centered, wrapping rows of
 * fixed-width cards, so headshots stay modest and every row centers. Every tier uses the same card
 * width, so every headshot is the same size.
 */
const ROW = "grid grid-cols-2 gap-x-4 gap-y-8 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-12 sm:gap-y-12";
const LONE = "[&:nth-child(odd):last-child]:col-span-2 [&:nth-child(odd):last-child]:mx-auto [&:nth-child(odd):last-child]:w-[calc(50%-0.5rem)]";
const CARD_WIDTH = "sm:w-48 sm:[&:nth-child(odd):last-child]:w-48";
/** Matches the rendered card width: 192px from 640px up, half the screen on phones. */
const IMAGE_SIZES = "(min-width: 640px) 192px, 50vw";

type TierHeaderProps = { index: number; eyebrow: string; title: string; id: string };

/** Centered team heading: sentence-case eyebrow over a heavy Chivo title. Shared by the tiers and the firm field. */
export function TierHeader({ index, eyebrow, title, id }: TierHeaderProps) {
  return (
    <header className="border-t border-rule pt-6 text-center md:pt-8">
      <Eyebrow index={index} className="!normal-case !tracking-[0.04em]">
        {eyebrow}
      </Eyebrow>
      <h2 id={id} className="mt-4 font-title text-h2 font-extrabold text-black">
        {title}
      </h2>
    </header>
  );
}

/** One tier of the leadership hierarchy (executive board, co-presidents, directors). */
export function LeadershipTier({ index, eyebrow, title, id, members, emptyText }: LeadershipTierProps) {
  if (members.length === 0 && !emptyText) return null;
  return (
    <Section labelledBy={id} density="compact">
      <TierHeader index={index} eyebrow={eyebrow} title={title} id={id} />
      <Reveal className="mt-8 md:mt-12">
        {members.length > 0 ? (
          <div className={ROW}>
            {members.map((person) => (
              <div key={person.slug} className={`w-full ${LONE} ${CARD_WIDTH}`}>
                <PersonCard person={person} sizes={IMAGE_SIZES} />
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
