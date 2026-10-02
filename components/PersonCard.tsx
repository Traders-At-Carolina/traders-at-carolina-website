import Image from "next/image";
import { LinkedInIcon } from "@/components/LinkedInIcon";
import type { Person } from "@/content/types";
import { initials, personMeta } from "@/lib/team";

type PersonCardProps = {
  person: Person;
  /** "portrait" is 4:5 (default); "square" is 1:1. */
  shape?: "portrait" | "square";
};

/**
 * Full-colour headshot, role, name, class year and major, optional placement and LinkedIn (spec 04 §3.1).
 * Only the LinkedIn icon is interactive; the card is the /team#{slug} anchor target.
 */
export function PersonCard({ person, shape = "portrait" }: PersonCardProps) {
  const meta = personMeta(person);
  return (
    <article id={person.slug} aria-labelledby={`${person.slug}-name`} className="scroll-mt-24 text-center">
      <div className={`relative overflow-hidden rounded-2xl ${shape === "square" ? "aspect-square" : "aspect-[4/5]"}`}>
        {person.headshot ? (
          <Image
            src={person.headshot}
            alt={person.alt ?? ""}
            fill
            sizes="(min-width: 640px) 240px, 192px"
            placeholder="blur"
            className="object-cover"
          />
        ) : (
          <div aria-hidden="true" className="flex h-full items-center justify-center border border-rule bg-white">
            <span className="font-display text-h1 text-navy">{initials(person.name)}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        {/* One treatment for every tier: role leads, name follows. */}
        <p className="font-display text-h3 text-navy">{person.role}</p>
        <h3 id={`${person.slug}-name`} className="mt-1 text-body text-ink-2">
          {person.name}
        </h3>
        {meta ? <p className="mt-1 text-caption text-ink-3 tabular">{meta}</p> : null}
        {person.placement ? <p className="mt-1 text-caption text-ink-2">{person.placement}</p> : null}
        {person.linkedin ? (
          <a
            href={person.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${person.name} on LinkedIn`}
            className="mt-1 inline-flex min-h-11 min-w-11 items-center justify-center text-navy hover:text-navy-press"
          >
            <LinkedInIcon />
          </a>
        ) : null}
      </div>
    </article>
  );
}
