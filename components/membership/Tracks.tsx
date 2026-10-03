import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import { TextLink } from "@/components/TextLink";
import type { MembershipContent } from "@/content/types";

type TracksProps = {
  index: number;
  title: string;
  tracks: MembershipContent["tracks"];
  /** slug → name, from content/team.ts once it exists. */
  leadNames: Record<string, string>;
};

/**
 * § 02 — the three tracks, each deep-linkable at /membership#{id} (spec 03 §3.3).
 * Desktop: three columns sharing subgrid rows (heading, description, good fit, sample problem, background),
 * so each part lines up across tracks whatever its length. Below 1024px: stacked blocks.
 * The "nothing is required" reassurance leads the section, where beginners see it first.
 */
export function Tracks({ index, title, tracks, leadNames }: TracksProps) {
  return (
    <Section id="tracks" labelledBy="tracks-title">
      <SectionHeader
        index={index}
        eyebrow="Tracks"
        title={title}
        id="tracks-title"
        lead="Recommended background is just that: none of it is required to join. Curiosity and consistent effort matter more."
      />
      <Reveal className="mt-12 md:mt-16">
        <div className="grid grid-cols-1 divide-y divide-rule lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {tracks.map((track) => {
            const lead = track.leadSlug ? leadNames[track.leadSlug] : undefined;
            return (
              <article
                key={track.id}
                id={track.id}
                aria-labelledby={`${track.id}-title`}
                className="flex scroll-mt-24 flex-col py-12 first:pt-0 last:pb-0 lg:row-span-5 lg:grid lg:grid-rows-subgrid lg:gap-y-0 lg:px-8 lg:py-0 lg:first:pl-0 lg:last:pr-0"
              >
                <div>
                  <p className="eyebrow">{track.roleLabel}</p>
                  <h3 id={`${track.id}-title`} className="mt-3 text-h3">
                    {track.name}
                  </h3>
                </div>
                <p className="mt-3 max-w-prose text-body text-ink-2">{track.description}</p>
                <div>
                  {track.goodFit ? (
                    <p className="mt-4 max-w-prose text-body">
                      <span className="font-medium">Good fit if you </span>
                      {track.goodFit}
                    </p>
                  ) : null}
                </div>
                <div>
                  {track.sampleProblem ? (
                    <figure className="mt-6 border-l border-rule-strong pl-4">
                      <figcaption className="text-caption font-medium text-ink-3">Sample problem</figcaption>
                      <blockquote className="mt-2 max-w-prose font-display text-body italic">{track.sampleProblem}</blockquote>
                    </figure>
                  ) : null}
                </div>
                <div className="mt-8">
                  <p className="text-caption font-medium text-ink-3">Recommended background</p>
                  <ul className="mt-3 flex flex-col gap-2 text-body">
                    {track.recommendedBackground.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {lead ? (
                    <p className="mt-6 text-caption">
                      <TextLink href={`/team#${track.leadSlug}`} track={{ cta: "track-lead", target: track.leadSlug }}>Led by {lead}</TextLink>
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </Reveal>
    </Section>
  );
}
