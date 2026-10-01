import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import { StatRow, type StatItem } from "@/components/Stat";

type ByTheNumbersProps = {
  index: number;
  title: string;
  stats: StatItem[];
};

/** § 03 — real numbers only, on white (spec 01 §3.3). Rendered only when at least one stat exists. */
export function ByTheNumbers({ index, title, stats }: ByTheNumbersProps) {
  return (
    <Section tone="white" labelledBy="numbers-title">
      <SectionHeader index={index} eyebrow="By the numbers" title={title} id="numbers-title" />
      <Reveal className="mt-12 md:mt-16">
        <StatRow stats={stats} />
      </Reveal>
    </Section>
  );
}
