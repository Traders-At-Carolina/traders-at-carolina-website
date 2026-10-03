import { ResourceList } from "@/components/portal/ResourceList";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import { TextLink } from "@/components/TextLink";
import type { PortalContent, TrackId } from "@/content/types";
import type { PortalResource } from "@/lib/data/portal";

type InterviewPrepProps = {
  index: number;
  title: string;
  prep: PortalContent["interviewPrep"];
  /** The `interview-prep` resources section, shown as practice material when an admin has posted some. */
  resources?: PortalResource[];
  trackNames?: Partial<Record<TrackId, string>>;
};

const COLUMN = "flex flex-col py-10 first:pt-0 last:pb-0 lg:px-8 lg:py-0 lg:first:pl-0 lg:last:pr-0";

/**
 * Preparing for the club's own interview: what to expect, what we look for, how to prepare (spec 09 §4.3).
 * Three columns divided by hairlines from 1024px, stacked below, like Tracks. Links point at the games and the
 * tracks' sample problems instead of repeating them.
 */
export function InterviewPrep({ index, title, prep, resources = [], trackNames = {} }: InterviewPrepProps) {
  return (
    <Section id="interview-prep" labelledBy="interview-prep-title">
      <SectionHeader index={index} eyebrow="Interview prep" title={title} lead={prep.lead} id="interview-prep-title" />
      <Reveal className="mt-12 md:mt-16">
        <div className="grid grid-cols-1 divide-y divide-rule lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <div className={COLUMN}>
            <h3 className="text-h3">What to expect</h3>
            <p className="mt-3 max-w-prose text-body text-ink-2">{prep.expect}</p>
          </div>
          <div className={COLUMN}>
            <h3 className="text-h3">What we look for</h3>
            <ul className="mt-3 flex flex-col gap-2 text-body">
              {prep.lookFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className={COLUMN}>
            <h3 className="text-h3">How to prepare</h3>
            <ol className="mt-3 flex flex-col gap-4 text-body">
              {prep.prepare.map((step, i) => (
                <li key={step.text} className="flex gap-3">
                  <span aria-hidden="true" className="pt-0.5 text-caption font-medium text-navy tabular">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    {step.text}
                    {step.link ? (
                      <>
                        {" "}
                        <TextLink href={step.link.href} arrow>
                          {step.link.label}
                        </TextLink>
                      </>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        {resources.length > 0 ? (
          <div className="mt-12 border-t border-rule pt-8 md:mt-16">
            <h3 className="text-h3">Practice material</h3>
            <ResourceList resources={resources} trackNames={trackNames} className="mt-4" />
          </div>
        ) : null}
      </Reveal>
    </Section>
  );
}
