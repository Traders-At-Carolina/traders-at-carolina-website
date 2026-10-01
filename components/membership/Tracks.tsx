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
 * Desktop: three columns. Tablet: full-width blocks with description and background side by side.
 */
export function Tracks({ index, title, tracks, leadNames }: TracksProps) {
  return (
    <Section labelledBy="tracks-title">
      <SectionHeader index={index} eyebrow="Tracks" title={title} id="tracks-title" />
      <Reveal className="mt-12 md:mt-16">
        <div className="grid grid-cols-1 divide-y divide-rule lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {tracks.map((track) => {
            const lead = track.leadSlug ? leadNames[track.leadSlug] : undefined;
            return (
              <article
                key={track.id}
                id={track.id}
                aria-labelledby={`${track.id}-title`}
                className="scroll-mt-24 py-10 first:pt-0 last:pb-0 md:grid md:grid-cols-12 md:gap-x-6 lg:flex lg:flex-col lg:px-8 lg:py-0 lg:first:pl-0 lg:last:pr-0"
              >
                <div className="md:col-span-7">
                  <p className="eyebrow">{track.roleLabel}</p>
                  <h3 id={`${track.id}-title`} className="mt-3 text-h3">
                    {track.name}
                  </h3>
                  <p className="mt-3 max-w-prose text-body text-ink-2 lg:min-h-[8.5rem]">{track.description}</p>
                </div>
                <div className="mt-6 md:col-span-5 md:mt-0 lg:mt-6">
                  <p className="text-caption font-medium uppercase tracking-[0.14em] text-ink-3">Recommended background</p>
                  <ul className="mt-3 flex flex-col gap-1.5 text-body">
                    {track.recommendedBackground.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {lead ? (
                    <p className="mt-5 text-caption">
                      <TextLink href={`/team#${track.leadSlug}`}>Led by {lead}</TextLink>
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-10 text-caption text-ink-3">None of these are required to join.</p>
      </Reveal>
    </Section>
  );
}
