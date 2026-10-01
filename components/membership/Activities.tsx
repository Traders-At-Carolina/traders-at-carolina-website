import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import type { MembershipContent } from "@/content/types";
import { formatActivityTracks } from "@/lib/membership";

type ActivitiesProps = {
  index: number;
  title: string;
  activities: MembershipContent["activities"];
  tracks: MembershipContent["tracks"];
};

/**
 * § 03 — one table: aligned columns from 1024px, stacked blocks below (spec 03 §3.4).
 * Explicit ARIA roles keep table semantics when CSS changes the display of table elements.
 */
export function Activities({ index, title, activities, tracks }: ActivitiesProps) {
  return (
    <Section labelledBy="activities-title">
      <SectionHeader index={index} eyebrow="What we do" title={title} id="activities-title" />
      <Reveal className="mt-12 md:mt-16">
        <table role="table" aria-labelledby="activities-title" className="block w-full border-t border-rule-strong lg:table lg:border-collapse">
          <thead role="rowgroup" className="sr-only lg:not-sr-only lg:table-header-group">
            <tr role="row" className="text-left text-caption text-ink-3">
              <th role="columnheader" scope="col" className="w-1/3 py-3 pr-6 font-normal">
                Activity
              </th>
              <th role="columnheader" scope="col" className="py-3 pr-6 font-normal">
                Description
              </th>
              <th role="columnheader" scope="col" className="w-40 py-3 pr-6 font-normal">
                Frequency
              </th>
              <th role="columnheader" scope="col" className="w-32 py-3 font-normal">
                Tracks
              </th>
            </tr>
          </thead>
          <tbody role="rowgroup" className="block lg:table-row-group">
            {activities.map((activity) => (
              <tr
                key={activity.name}
                role="row"
                className="flex flex-wrap items-baseline gap-x-2 border-b border-rule py-6 lg:table-row lg:border-t lg:py-0"
              >
                <th role="rowheader" scope="row" className="order-1 w-full text-left font-normal lg:w-auto lg:py-6 lg:pr-6 lg:align-top">
                  <span className="font-display text-h3">{activity.name}</span>
                </th>
                <td role="cell" className="order-3 mt-2 w-full max-w-prose text-body text-ink-2 lg:mt-0 lg:w-auto lg:py-6 lg:pr-6 lg:align-top">
                  {activity.description}
                </td>
                <td role="cell" className="order-2 mt-1 text-caption font-medium text-navy tabular empty:hidden lg:mt-0 lg:table-cell lg:empty:table-cell lg:py-6 lg:pr-6 lg:align-top lg:text-body">
                  {activity.frequency ?? ""}
                </td>
                <td role="cell" className="order-2 mt-1 text-caption text-ink-3 lg:mt-0 lg:py-6 lg:align-top">
                  {activity.frequency ? <span aria-hidden="true" className="mr-2 lg:hidden">·</span> : null}
                  {formatActivityTracks(activity.tracks, tracks)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
    </Section>
  );
}
