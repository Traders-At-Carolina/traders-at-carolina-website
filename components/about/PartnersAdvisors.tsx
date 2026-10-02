import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import { SponsorMark } from "@/components/SponsorMark";
import { TextLink } from "@/components/TextLink";
import type { AboutContent, Advisor, Partner } from "@/content/types";
import { sortPartners } from "@/lib/about";

type PartnersAdvisorsProps = {
  index: number;
  headings: AboutContent["headings"];
  partners: Partner[];
  advisors: Advisor[];
};

/**
 * § 04 — typeset partner names and optional advisors, on graphite (spec 02 §3.5).
 * With advisors but no partners the section becomes "Advisors"; the caller omits it when both are empty.
 */
export function PartnersAdvisors({ index, headings, partners, advisors }: PartnersAdvisorsProps) {
  const advisorsOnly = partners.length === 0;

  return (
    <Section id="partners" tone="graphite" labelledBy="partners-title">
      <SectionHeader
        index={index}
        eyebrow={advisorsOnly ? "Advisors" : "Partners and advisors"}
        title={advisorsOnly ? headings.advisorsOnly : headings.partners}
        id="partners-title"
      />
      <Reveal className="mt-12 md:mt-16">
        {partners.length > 0 ? (
          <ul className="grid grid-cols-1 gap-x-6 md:grid-cols-2 lg:grid-cols-3">
            {sortPartners(partners).map((partner) => (
              <li key={partner.name} className="border-t border-rule py-5">
                <h3 className="flex items-center gap-4 text-h3">
                  {partner.url ? (
                    <TextLink href={partner.url} external>
                      {partner.name}
                    </TextLink>
                  ) : (
                    partner.name
                  )}
                  {partner.logo ? <SponsorMark logo={partner.logo} /> : null}
                </h3>
                {partner.relationship ? <p className="mt-1 text-caption text-ink-3">{partner.relationship}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}

        {advisors.length > 0 ? (
          <div className={partners.length > 0 ? "mt-16" : ""}>
            {partners.length > 0 ? <Eyebrow>Advisors</Eyebrow> : null}
            <ul className={`grid grid-cols-1 gap-x-6 md:grid-cols-2 ${partners.length > 0 ? "mt-6" : ""}`}>
              {advisors.map((advisor) => (
                <li key={advisor.name} className="border-t border-rule py-5">
                  <h3 className="text-h3">{advisor.name}</h3>
                  <p className="mt-1 text-caption text-ink-3">
                    {advisor.title}, {advisor.department}
                  </p>
                  {advisor.note ? <p className="mt-2 text-body text-ink-2">{advisor.note}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Reveal>
    </Section>
  );
}
