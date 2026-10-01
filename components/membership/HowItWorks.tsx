import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import type { MembershipContent } from "@/content/types";

type HowItWorksProps = {
  index: number;
  title: string;
  steps: MembershipContent["steps"];
  switchingPolicy?: string;
};

/** § 01 — three numbered steps with → between them on desktop (spec 03 §3.2). */
export function HowItWorks({ index, title, steps, switchingPolicy }: HowItWorksProps) {
  return (
    <Section labelledBy="how-title">
      <SectionHeader index={index} eyebrow="How it works" title={title} id="how-title" />
      <Reveal className="mt-12 md:mt-16">
        <ol className="grid grid-cols-1 divide-y divide-rule lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {steps.map((step, i) => (
            <li key={step.title} className="relative py-8 first:pt-0 last:pb-0 lg:px-8 lg:py-0 lg:first:pl-0 lg:last:pr-0">
              <p aria-hidden="true" className="text-caption font-medium text-navy tabular">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 text-h3">{step.title}</h3>
              <p className="mt-3 max-w-prose text-body text-ink-2">{step.body}</p>
              {i < steps.length - 1 ? (
                <span aria-hidden="true" className="absolute top-0 -right-2.5 hidden bg-bone px-1 text-caption text-ink-3 lg:block">
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        {switchingPolicy ? <p className="mt-10 text-caption text-ink-3">{switchingPolicy}</p> : null}
      </Reveal>
    </Section>
  );
}
