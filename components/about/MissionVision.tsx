import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import type { AboutContent } from "@/content/types";

type MissionVisionProps = {
  index: number;
  title: string;
  mission: AboutContent["mission"];
  vision: AboutContent["vision"];
};

/** § 01 — mission and vision side by side, divided by a hairline (spec 02 §3.2). */
export function MissionVision({ index, title, mission, vision }: MissionVisionProps) {
  const blocks = [
    { label: "Mission", ...mission },
    { label: "Vision", ...vision },
  ];

  return (
    <Section labelledBy="mission-title">
      <SectionHeader index={index} eyebrow="Mission and vision" title={title} id="mission-title" />
      <Reveal className="mt-12 grid grid-cols-1 divide-y divide-rule md:mt-16 md:grid-cols-2 md:divide-x md:divide-y-0">
        {blocks.map((block) => (
          <div key={block.label} className="py-8 first:pt-0 last:pb-0 md:px-10 md:py-0 md:first:pl-0 md:last:pr-0">
            <Eyebrow>{block.label}</Eyebrow>
            <h3 className="mt-3 max-w-prose text-h3">{block.statement}</h3>
            <p className="mt-3 max-w-prose text-body text-ink-2">{block.body}</p>
          </div>
        ))}
      </Reveal>
    </Section>
  );
}
