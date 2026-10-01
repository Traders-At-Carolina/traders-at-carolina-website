import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import type { ApplyContent } from "@/content/types";

type ProcessProps = {
  stages: ApplyContent["stages"];
  /** One per stage; undefined falls back to the stage's generic timing. */
  dates: Array<string | undefined>;
  lead: string;
};

/** § 01 — application, interview and decision, with dates for the current cycle (spec 05 §4.2). */
export function Process({ stages, dates, lead }: ProcessProps) {
  return (
    <Section id="process" labelledBy="process-title" className="scroll-mt-20">
      <SectionHeader index={1} eyebrow="Process and dates" title="What happens after you apply." lead={lead} id="process-title" />
      <Reveal as="ol" className="mt-12 border-t border-rule-strong md:mt-16">
        {stages.map((stage, i) => {
          const when = dates[i] ?? stage.genericTiming;
          return (
            <li key={stage.title} className="grid grid-cols-12 gap-x-6 gap-y-2 border-b border-rule py-6">
              <p aria-hidden="true" className="col-span-2 text-caption font-medium text-navy tabular lg:col-span-1">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="col-span-10 text-h3 lg:col-span-3">{stage.title}</h3>
              <p className="col-span-12 text-caption font-medium text-navy tabular empty:hidden lg:order-last lg:col-span-3 lg:text-right lg:text-body">
                {when ?? ""}
              </p>
              <p className="col-span-12 max-w-prose text-body text-ink-2 lg:col-span-5">{stage.description}</p>
            </li>
          );
        })}
      </Reveal>
    </Section>
  );
}
