import { Library, NotebookPen, Presentation, type LucideIcon } from "lucide-react";
import { Glyph } from "@/components/membership/icons";
import { ResourceList } from "@/components/portal/ResourceList";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import type { TrackId } from "@/content/types";
import type { PortalResource, ResourceKind } from "@/lib/data/portal";

type LearningProps = {
  index: number;
  title: string;
  lead: string;
  /** Shown in each column with nothing posted. */
  empty: string;
  /** The `learning` section, sorted pinned first. */
  learning: PortalResource[];
  /** The `other` section, which joins the last column. */
  other: PortalResource[];
  trackNames: Partial<Record<TrackId, string>>;
};

const COLUMNS: Array<{ title: string; icon: LucideIcon; kinds: ResourceKind[] }> = [
  { title: "Slides", icon: Presentation, kinds: ["slides"] },
  { title: "Notes", icon: NotebookPen, kinds: ["notes"] },
  { title: "Resources and textbooks", icon: Library, kinds: ["textbook", "problem-set", "video", "link"] },
];

/**
 * Members only: learning resources in three columns by kind, each a list of links or "Nothing posted yet"
 * (spec 09 §4.7). Columns divided by hairlines from 1024px, like Tracks. Columns are divs, not sections, so the
 * progress rail counts this as one section.
 */
export function Learning({ index, title, lead, empty, learning, other, trackNames }: LearningProps) {
  return (
    <Section id="learning" labelledBy="learning-title">
      <SectionHeader index={index} eyebrow="Learning" title={title} lead={lead} id="learning-title" />
      <Reveal className="mt-12 md:mt-16">
        <div className="grid grid-cols-1 divide-y divide-rule lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {COLUMNS.map((column, i) => {
            const items = learning.filter((resource) => column.kinds.includes(resource.kind));
            if (i === COLUMNS.length - 1) items.push(...other);
            return (
              <div key={column.title} className="flex flex-col py-10 first:pt-0 last:pb-0 lg:px-8 lg:py-0 lg:first:pl-0 lg:last:pr-0">
                <Glyph icon={column.icon} className="mb-4" />
                <h3 className="text-h3">{column.title}</h3>
                {items.length > 0 ? (
                  <ResourceList resources={items} trackNames={trackNames} className="mt-4" />
                ) : (
                  <p className="mt-3 text-body text-ink-3">{empty}</p>
                )}
              </div>
            );
          })}
        </div>
      </Reveal>
    </Section>
  );
}
