import { Grid } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import type { AboutContent, TimelineEntry } from "@/content/types";
import { showMilestones, sortTimeline } from "@/lib/about";

type OurStoryProps = {
  index: number;
  title: string;
  story: AboutContent["story"];
  timeline: TimelineEntry[];
};

function PullQuote({ quote }: { quote: NonNullable<AboutContent["story"]["quote"]> }) {
  const year = quote.classYear ? `, '${String(quote.classYear).slice(-2)}` : "";
  return (
    <figure>
      <div aria-hidden="true" className="h-px w-12 bg-navy" />
      <blockquote className="mt-6 font-display text-h2 italic">
        <p>“{quote.text}”</p>
      </blockquote>
      <figcaption className="mt-4 text-caption text-ink-3">
        — {quote.name}, {quote.role}
        {year}
      </figcaption>
    </figure>
  );
}

/**
 * § 02 — founding story prose, optional pull quote and a milestones list that appears at 3+ entries (spec 02 §3.3).
 * The first paragraph gets its own row so the quote aligns with the top of the second paragraph on desktop.
 */
export function OurStory({ index, title, story, timeline }: OurStoryProps) {
  const [first, ...rest] = story.paragraphs;
  const milestones = showMilestones(timeline) ? sortTimeline(timeline) : [];

  return (
    <Section labelledBy="story-title">
      <SectionHeader index={index} eyebrow="Our story" title={title} id="story-title" />
      <Reveal className="mt-12 md:mt-16">
        <Grid className="gap-y-6">
          {first ? <p className="col-span-12 max-w-prose text-body lg:col-span-7">{first}</p> : null}
          {rest.length > 0 ? (
            <div className="col-span-12 flex max-w-prose flex-col gap-6 lg:col-span-7">
              {rest.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="text-body">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}
          {story.quote ? (
            <div className="col-span-12 my-2 lg:col-span-4 lg:col-start-9 lg:row-start-2 lg:my-0">
              <PullQuote quote={story.quote} />
            </div>
          ) : null}
          {milestones.length > 0 ? (
            <ol className={`col-span-12 border-t border-rule lg:col-span-7 ${first ? "mt-6" : ""}`}>
              {milestones.map((entry) => (
                <li key={`${entry.year}-${entry.title}`} className="grid grid-cols-[6ch_1fr] gap-x-6 border-b border-rule py-4">
                  <span className="font-medium text-navy tabular">{entry.year}</span>
                  <div>
                    <p className="font-medium">{entry.title}</p>
                    {entry.description ? <p className="mt-1 text-body text-ink-2">{entry.description}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
        </Grid>
      </Reveal>
    </Section>
  );
}
