import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import { SponsorMark } from "@/components/SponsorMark";
import { StatRow, type StatItem } from "@/components/Stat";
import type { Partner } from "@/content/types";

type ByTheNumbersProps = {
  index: number;
  title: string;
  stats: StatItem[];
  sponsors: Pick<Partner, "name" | "logo">[];
};

/**
 * § 03 — real numbers and the firms that sponsor the club, on graphite (spec 01 §3.3).
 * A stat row needs at least two figures; a lone one becomes the section heading instead.
 */
export function ByTheNumbers({ index, title, stats, sponsors }: ByTheNumbersProps) {
  const shown = stats.filter((s) => s.value);
  const [lone] = shown.length === 1 ? shown : [];
  const heading = lone ? `${lone.phrase ?? `${lone.value} ${lone.label.toLowerCase()}`}.` : title;

  return (
    <Section tone="graphite" labelledBy="numbers-title">
      <SectionHeader index={index} eyebrow={lone ? "At a glance" : "By the numbers"} title={heading} id="numbers-title" tone="inverse" />
      <Reveal className="mt-12 md:mt-16">
        {lone ? null : <StatRow stats={stats} tone="inverse" />}
        {sponsors.length > 0 ? (
          <div className={`${lone ? "" : "mt-12 border-t border-rule-inverse pt-6 md:mt-16 md:pt-8"}`}>
            <Eyebrow tone="inverse">Sponsored by</Eyebrow>
            <ul className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-2 lg:flex lg:flex-wrap lg:gap-x-16">
              {sponsors.map(({ name, logo }) => (
                <li key={name} className="flex items-center gap-4 font-display text-h3">
                  {name}
                  {logo ? <SponsorMark logo={logo} /> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Reveal>
    </Section>
  );
}
