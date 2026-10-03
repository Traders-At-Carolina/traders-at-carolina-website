import Image from "next/image";
import { LinkedInIcon } from "@/components/LinkedInIcon";
import type { CompanyMark, Person } from "@/content/types";
import { trackAttrs } from "@/lib/analytics/attributes";
import { initials, personMeta } from "@/lib/team";

type PersonCardProps = {
  person: Person;
  /** Image `sizes` hint matching the card's rendered width at each breakpoint. */
  sizes?: string;
};

/**
 * The placement company's mark on a fixed white square tile in the headshot's bottom-left corner, so every logo,
 * wide or square, shows at the same size. Mouse users see it on hover; touch screens
 * (no hover) always show it.
 * Decorative: the placement line under the name already names the company.
 */
function CompanyBadge({ company }: { company: CompanyMark }) {
  return (
    <span
      aria-hidden="true"
      className="absolute bottom-2 left-2 flex size-10 translate-y-1 items-center justify-center rounded-md bg-white p-1.5 shadow-sm opacity-0 transition duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100"
    >
      <Image src={company.logo} alt="" sizes="28px" className="size-full object-contain" />
    </span>
  );
}

/**
 * Full-colour headshot, role, name, class year and major, optional placement and LinkedIn (spec 04 §3.1).
 * Only the LinkedIn icon is interactive; the card is the /team#{slug} anchor target.
 */
export function PersonCard({ person, sizes = "(min-width: 640px) 192px, 50vw" }: PersonCardProps) {
  const meta = personMeta(person);
  return (
    <article id={person.slug} aria-labelledby={`${person.slug}-name`} className="scroll-mt-24 text-center">
      <div className="group relative aspect-square overflow-hidden">
        {person.headshot ? (
          <Image
            src={person.headshot}
            alt={person.alt ?? ""}
            fill
            sizes={sizes}
            placeholder={person.headshot.blurDataURL ? "blur" : "empty"}
            className="object-cover object-[50%_25%]"
          />
        ) : (
          <div aria-hidden="true" className="flex h-full items-center justify-center on-dark surface-graphite border border-rule">
            <span className="font-display text-h1 text-navy">{initials(person.name)}</span>
          </div>
        )}
        {person.company ? <CompanyBadge company={person.company} /> : null}
      </div>
      <div className="mt-4">
        {/* One treatment for every tier: role leads as a label, the name is the line people remember. */}
        <p className="text-caption font-medium text-navy">{person.role}</p>
        <h3 id={`${person.slug}-name`} className="mt-1 font-display text-h3 text-black">
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
            {...trackAttrs({ cta: "linkedin", target: person.slug })}
            className="mt-1 inline-flex min-h-11 min-w-11 items-center justify-center text-navy hover:text-navy-press"
          >
            <LinkedInIcon />
          </a>
        ) : null}
      </div>
    </article>
  );
}
