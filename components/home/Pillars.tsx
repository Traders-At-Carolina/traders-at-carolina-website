import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import { TextLink } from "@/components/TextLink";
import type { HomeContent } from "@/content/types";

type PillarsProps = {
  index: number;
  title: string;
  pillars: HomeContent["pillars"];
};

/** § 02 — preparation, engagement, opportunity in hairline-divided columns (spec 01 §3.2). */
export function Pillars({ index, title, pillars }: PillarsProps) {
  return (
    <Section labelledBy="pillars-title">
      <SectionHeader index={index} eyebrow="What we do" title={title} id="pillars-title" />
      <Reveal as="ol" className="mt-12 grid grid-cols-1 divide-y divide-rule md:mt-16 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {pillars.map((pillar, i) => (
          <li key={pillar.title} className="max-w-prose py-8 first:pt-0 last:pb-0 lg:px-8 lg:py-0 lg:first:pl-0 lg:last:pr-0">
            <p aria-hidden="true" className="text-caption font-medium text-navy tabular">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-3 text-h3">{pillar.title}</h3>
            <p className="mt-3 text-body text-ink-2">{pillar.body}</p>
            <p className="mt-5">
              <TextLink href={pillar.link.href} arrow className="hit-target">
                {pillar.link.label}
              </TextLink>
            </p>
          </li>
        ))}
      </Reveal>
    </Section>
  );
}
