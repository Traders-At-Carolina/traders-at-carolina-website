import { Container } from "@/components/Container";
import { InlineMarkdown } from "@/components/InlineMarkdown";
import type { PortalAnnouncement } from "@/lib/data/portal";

/**
 * Admin-posted announcements between the header and the first section, already filtered and ordered (pinned first,
 * then newest; spec 06 §8). Renders nothing when there are none. An aside, not a section, so it never takes a § number.
 */
export function Announcements({ announcements }: { announcements: PortalAnnouncement[] }) {
  if (announcements.length === 0) return null;
  return (
    <aside aria-label="Announcements" className="border-y border-rule bg-white">
      <Container className="py-8 md:py-10">
        <ul className="flex flex-col divide-y divide-rule">
          {announcements.map((announcement) => (
            <li key={announcement.id} className="py-5 first:pt-0 last:pb-0 md:grid md:grid-cols-12 md:gap-x-6">
              <p className="font-display text-h3 md:col-span-4">{announcement.title}</p>
              <p className="mt-2 max-w-prose text-body text-ink-2 md:col-span-8 md:mt-1">
                <InlineMarkdown source={announcement.body} />
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </aside>
  );
}
