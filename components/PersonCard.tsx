import Image from "next/image";
import { LinkedInIcon } from "@/components/LinkedInIcon";
import type { Person } from "@/content/types";
import { initials, personMeta } from "@/lib/team";

/**
 * Headshot, role, name, class year and major, optional placement and LinkedIn (spec 04 §3.1).
 * Only the LinkedIn icon is interactive; the card is the /team#{slug} anchor target.
 */
export function PersonCard({ person }: { person: Person }) {
  return (
    <article id={person.slug} aria-labelledby={`${person.slug}-name`} className="scroll-mt-24">
      <div className="relative aspect-[4/5] overflow-hidden">
        {person.headshot ? (
          <Image
            src={person.headshot}
            alt={person.alt ?? ""}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            placeholder="blur"
            className="object-cover grayscale"
          />
        ) : (
          <div aria-hidden="true" className="flex h-full items-center justify-center border border-rule bg-white">
            <span className="font-display text-h1 text-navy">{initials(person.name)}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="eyebrow">{person.role}</p>
        <h3 id={`${person.slug}-name`} className="mt-2 text-h3">
          {person.name}
        </h3>
        {personMeta(person) ? <p className="mt-1 text-caption text-ink-3 tabular">{personMeta(person)}</p> : null}
        {person.placement ? <p className="mt-1 text-caption text-ink-2">{person.placement}</p> : null}
        {person.linkedin ? (
          <a
            href={person.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${person.name} on LinkedIn`}
            className="-ml-3 mt-1 inline-flex min-h-11 min-w-11 items-center justify-center text-navy hover:text-navy-press"
          >
            <LinkedInIcon />
          </a>
        ) : null}
      </div>
    </article>
  );
}
