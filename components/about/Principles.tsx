import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import type { AboutContent } from "@/content/types";

type PrinciplesProps = {
  index: number;
  title: string;
  principles: AboutContent["principles"];
};

// 2 × 2 grid on desktop: hairline between the columns and between the rows (spec 02 §3.4).
const twoByTwo = [
  "lg:border-r lg:border-b lg:pr-10 lg:pb-10",
  "lg:border-b lg:pl-10 lg:pb-10",
  "lg:border-r lg:pr-10 lg:pt-10",
  "lg:pl-10 lg:pt-10",
];

/** § 03 — 3–4 numbered principles; 2 × 2 with four, one row of three with three. */
export function Principles({ index, title, principles }: PrinciplesProps) {
  const four = principles.length === 4;

  return (
    <Section labelledBy="principles-title">
      <SectionHeader index={index} eyebrow="Principles" title={title} id="principles-title" />
      <Reveal
        as="ol"
        className={`mt-12 grid grid-cols-1 divide-y divide-rule md:mt-16 lg:divide-y-0 ${
          four ? "lg:grid-cols-2" : "lg:grid-cols-3 lg:divide-x"
        }`}
      >
        {principles.map((principle, i) => (
          <li
            key={principle.title}
            className={`border-rule py-8 first:pt-0 last:pb-0 ${
              four ? `lg:py-0 ${twoByTwo[i]}` : "lg:px-8 lg:py-0 lg:first:pl-0 lg:last:pr-0"
            }`}
          >
            <p aria-hidden="true" className="text-caption font-medium text-navy tabular">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-3 text-h3">{principle.title}</h3>
            <p className="mt-3 max-w-prose text-body text-ink-2">{principle.body}</p>
          </li>
        ))}
      </Reveal>
    </Section>
  );
}
