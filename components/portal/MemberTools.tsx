import { Link2, Sheet, Trophy } from "lucide-react";
import { Card } from "@/components/Card";
import { Glyph } from "@/components/membership/icons";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import { TextLink } from "@/components/TextLink";
import type { PortalContent } from "@/content/types";
import type { PortalLink } from "@/lib/data/portal";

type MemberToolsProps = {
  index: number;
  title: string;
  tools: PortalContent["tools"];
  /** portalLinks(viewer), in admin order: the internship tracker, Slack, Drive, the calendar (spec 06 §8). */
  links: PortalLink[];
};

/**
 * Members only: one card per member link, then Competitions, still to come (spec 09 §4.8). Until an admin adds a link,
 * a single card says where the internship tracker will be.
 */
export function MemberTools({ index, title, tools, links }: MemberToolsProps) {
  return (
    <Section id="member-tools" labelledBy="member-tools-title">
      <SectionHeader index={index} eyebrow="Member tools" title={title} id="member-tools-title" />
      <Reveal className="mt-12 grid grid-cols-1 gap-6 md:mt-16 md:grid-cols-2">
        {links.length > 0 ? (
          links.map((link) => (
            <Card key={link.id} className="flex flex-col">
              <Glyph icon={Link2} className="mb-4" />
              <h3 className="text-h3">
                <TextLink href={link.url} external arrow>
                  {link.label}
                </TextLink>
              </h3>
              {link.description ? <p className="mt-3 max-w-prose text-body text-ink-2">{link.description}</p> : null}
            </Card>
          ))
        ) : (
          <Card className="flex flex-col">
            <Glyph icon={Sheet} className="mb-4" />
            <h3 className="text-h3">{tools.linksPending.title}</h3>
            <p className="mt-3 max-w-prose text-body text-ink-2">{tools.linksPending.body}</p>
            <p className="mt-auto pt-6 text-caption text-ink-3">{tools.linksPending.pending}</p>
          </Card>
        )}
        <Card className="flex flex-col">
          <Glyph icon={Trophy} className="mb-4" />
          <h3 className="text-h3">{tools.competitions.title}</h3>
          <p className="mt-3 max-w-prose text-body text-ink-2">{tools.competitions.body}</p>
        </Card>
      </Reveal>
    </Section>
  );
}
