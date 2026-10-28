import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";

type PrepResourcesProps = {
  index: number;
};

/** Public club tool, so it lives in code rather than the admin's resources. */
const COUNTDOWN = {
  title: "Countdown",
  description: "Timed mental math and estimation drills to practise thinking quickly out loud.",
  href: "https://tac-countdown-2eum.vercel.app/",
};

/** Prep resources: tools anyone can use to get ready for the club's interview and trading interviews. */
export function PrepResources({ index }: PrepResourcesProps) {
  return (
    <Section labelledBy="prep-resources-title">
      <SectionHeader index={index} eyebrow="Prep resources" title="Practise before you apply." id="prep-resources-title" />
      <Reveal className="mt-12 md:mt-16">
        <a
          href={COUNTDOWN.href}
          target="_blank"
          rel="noopener noreferrer"
          className="on-dark surface-graphite block max-w-prose border border-rule p-6 md:p-8"
        >
          <span className="text-h3">
            {COUNTDOWN.title} <span aria-hidden="true">↗</span>
          </span>
          <span className="mt-2 block text-body">{COUNTDOWN.description}</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </Reveal>
    </Section>
  );
}
