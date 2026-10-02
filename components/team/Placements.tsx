import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";

type PlacementsProps = {
  index: number;
  /** Already sorted firm names. */
  firms: string[];
};

/** § 03 — firm names only, typeset, on graphite. Rendered only at 5+ firms (spec 04 §4.4). */
export function Placements({ index, firms }: PlacementsProps) {
  return (
    <Section tone="graphite" labelledBy="placements-title">
      <SectionHeader
        index={index}
        eyebrow="Placements"
        title="Where members have gone."
        lead="Firms where Traders at Carolina members and alumni have interned or worked full-time."
        id="placements-title"
      />
      <Reveal as="ul" className="mt-12 grid grid-cols-1 gap-x-6 md:mt-16 md:grid-cols-2 lg:grid-cols-3">
        {firms.map((firm) => (
          <li key={firm} className="border-t border-rule py-5 font-display text-h3">
            {firm}
          </li>
        ))}
      </Reveal>
    </Section>
  );
}
