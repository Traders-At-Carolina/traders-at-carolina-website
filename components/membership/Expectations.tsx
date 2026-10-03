import { Glyph, expectationIcon } from "@/components/membership/icons";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import type { MembershipContent } from "@/content/types";
import { expectationRows } from "@/lib/membership";

type ExpectationsProps = {
  index: number;
  title: string;
  expectations: MembershipContent["expectations"];
};

/** Time, attendance and prerequisites as a definition list, on graphite (spec 03 §3.5). */
export function Expectations({ index, title, expectations }: ExpectationsProps) {
  return (
    <Section tone="graphite" id="expectations" labelledBy="expectations-title">
      <SectionHeader index={index} eyebrow="Expectations" title={title} id="expectations-title" />
      <Reveal className="mt-12 md:mt-16">
        <dl className="border-t border-rule">
          {expectationRows(expectations).map((row) => (
            <div key={row.term} className="grid grid-cols-12 gap-x-6 gap-y-2 border-b border-rule py-6">
              <dt className="col-span-12 font-display text-h3 md:col-span-4"><span className="inline-flex items-center gap-3">
                  <Glyph icon={expectationIcon(row.term)} />
                  {row.term}
                </span>
              </dt>
              <dd className="col-span-12 font-medium text-navy tabular md:col-span-3">{row.value}</dd>
              <dd className="col-span-12 max-w-prose text-body text-ink-2 md:col-span-5">{row.detail}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </Section>
  );
}
