import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import type { ApplyContent } from "@/content/types";

type ProcessProps = {
  stages: ApplyContent["stages"];
  /** One per stage; undefined falls back to the stage's generic timing. */
  dates: Array<string | undefined>;
  /** One per stage; how much each stage asks of the applicant. */
  efforts: Array<string | undefined>;
  lead: string;
  /** Index of the stage happening now (the Application stage while open). */
  current?: number;
  /** Section number, eyebrow, H2 and id default to /apply's; the portal reuses the rail with its own (spec 09 §4.2). */
  index?: number;
  eyebrow?: string;
  title?: string;
  id?: string;
  /** One action under the rail (the portal's Apply or Keep me posted). /apply has its own actions elsewhere. */
  action?: ReactNode;
};

/**
 * § 02 — application, interview and decision as a stepped timeline (spec 05 §4.3).
 * A horizontal rail on desktop, a vertical one on mobile; the current stage's node is filled.
 */
export function Process({
  stages,
  dates,
  efforts,
  lead,
  current,
  index = 2,
  eyebrow = "Process and dates",
  title = "What happens after you apply.",
  id = "process",
  action,
}: ProcessProps) {
  return (
    <Section id={id} labelledBy={`${id}-title`} className="scroll-mt-20">
      <SectionHeader index={index} eyebrow={eyebrow} title={title} lead={lead} id={`${id}-title`} />
      <Reveal as="ol" className="mt-12 grid grid-cols-1 md:mt-16 lg:grid-cols-3 lg:gap-x-8">
        {stages.map((stage, i) => {
          const when = dates[i] ?? stage.genericTiming;
          const isCurrent = current === i;
          return (
            <li key={stage.title} className="group relative pb-10 pl-9 last:pb-0 lg:pt-9 lg:pb-0 lg:pl-0">
              {/* Rail: vertical between nodes on mobile, horizontal across the row (bridging the gap) on desktop. */}
              <span aria-hidden="true" className="absolute top-4 bottom-0 left-[5px] w-px bg-rule-strong group-last:hidden lg:hidden" />
              <span aria-hidden="true" className="absolute top-[5px] right-0 left-0 hidden h-px bg-rule-strong lg:block lg:-right-8 lg:group-last:right-0" />
              <span
                aria-hidden="true"
                className={`absolute top-1 left-0 size-[11px] rounded-full border-2 border-navy lg:top-0 ${isCurrent ? "bg-navy" : "bg-bone"}`}
              />
              <p className="flex flex-wrap items-baseline gap-x-3 text-caption font-medium tabular">
                <span aria-hidden="true" className="text-navy">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {when ? <span className="text-navy">{when}</span> : null}
                {isCurrent ? <span className="eyebrow text-navy">Open now</span> : null}
              </p>
              <h3 className="mt-2 text-h3">{stage.title}</h3>
              {efforts[i] ? <p className="mt-1 text-caption text-ink-3">{efforts[i]}</p> : null}
              <p className="mt-3 max-w-prose text-body text-ink-2">{stage.description}</p>
            </li>
          );
        })}
      </Reveal>
      {action ? <div className="mt-12 md:mt-16">{action}</div> : null}
    </Section>
  );
}
