import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import { TextLink } from "@/components/TextLink";
import type { ApplyContent } from "@/content/types";

type WhatYouGetProps = {
  benefits: ApplyContent["benefits"];
  /** The page's primary action, rendered by the caller so it can switch live at the deadline. */
  action: ReactNode;
};

/** § 01 — why it's worth applying: three benefits in columns, then the primary action again (spec 05 §4.2). */
export function WhatYouGet({ benefits, action }: WhatYouGetProps) {
  return (
    <Section id="what-you-get" labelledBy="benefits-title">
      <SectionHeader index={1} eyebrow="What you get" title="Everything you need to break into quant." id="benefits-title" />
      <Reveal className="mt-12 md:mt-16">
        <ul className="grid grid-cols-1 divide-y divide-rule lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {benefits.map((benefit) => (
            <li key={benefit.title} className="flex flex-col py-8 first:pt-0 last:pb-0 lg:px-8 lg:py-0 lg:first:pl-0 lg:last:pr-0">
              <h3 className="text-h3">{benefit.title}</h3>
              <p className="mt-3 max-w-prose text-body text-ink-2">{benefit.body}</p>
              {benefit.link ? (
                <TextLink href={benefit.link.href} arrow className="mt-4 self-start">
                  {benefit.link.label}
                </TextLink>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="mt-12 md:mt-16">
          {action}
        </div>
      </Reveal>
    </Section>
  );
}
