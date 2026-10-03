import type { Metadata } from "next";
import { ApplyButton } from "@/components/ApplyButton";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { CTABand } from "@/components/CTABand";
import { Grid } from "@/components/Container";
import { Eyebrow } from "@/components/Eyebrow";
import { VolSurfaceFigure } from "@/components/home/VolSurfaceFigure";
import { PageHeader } from "@/components/PageHeader";
import { RandomWalk } from "@/components/RandomWalk";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import { StatRow } from "@/components/Stat";
import { TextLink } from "@/components/TextLink";

export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false },
};

const colors = [
  { name: "bone", className: "bg-bone" },
  { name: "white", className: "bg-white" },
  { name: "navy", className: "bg-navy" },
  { name: "black", className: "bg-black" },
  { name: "ink-2", className: "bg-ink-2" },
  { name: "ink-3", className: "bg-ink-3" },
  { name: "navy-press", className: "bg-navy-press" },
];

const typeRoles = [
  { role: "Hero", className: "font-display text-hero", sample: "Traders at Carolina" },
  { role: "Display", className: "font-display text-display", sample: "Rigor, practiced together." },
  { role: "H1", className: "font-display text-h1", sample: "Built by students, for the long game." },
  { role: "H2", className: "font-display text-h2", sample: "Three ways we build quants." },
  { role: "H3", className: "font-display text-h3", sample: "Preparation" },
  { role: "Lead", className: "text-lead text-ink-2", sample: "Members join one of three tracks." },
  { role: "Body", className: "text-body", sample: "Weekly sessions on probability, statistics and market microstructure." },
  { role: "Caption", className: "text-caption text-ink-3", sample: "Mock trading night, Spring 2026" },
  { role: "Stat", className: "text-stat font-medium text-navy tabular", sample: "0123456789" },
];

/** Internal reference for every spec 00 token and shared component. Not indexed. */
export default function StyleguidePage() {
  return (
    <>
      <PageHeader
        eyebrow="Styleguide"
        title="Spec 00 components"
        lead="Every token and shared component from the vision and style spec, rendered in one place."
        seed={42}
      />

      <Section labelledBy="sg-color">
        <SectionHeader index={1} eyebrow="Color" title="Four brand colors, derived tints" id="sg-color" />
        <ul className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-7">
          {colors.map((c) => (
            <li key={c.name}>
              <div className={`h-20 border border-rule ${c.className}`} />
              <p className="mt-2 text-caption text-ink-3">{c.name}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="white" labelledBy="sg-type">
        <SectionHeader index={2} eyebrow="Typography" title="Georgia for headlines, Public Sans for everything else" id="sg-type" />
        <dl className="mt-12 divide-y divide-rule border-y border-rule">
          {typeRoles.map((t) => (
            <div key={t.role} className="grid grid-cols-12 items-baseline gap-4 py-6">
              <dt className="col-span-12 text-caption text-ink-3 md:col-span-2">{t.role}</dt>
              <dd className={`col-span-12 md:col-span-10 ${t.className}`}>{t.sample}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section labelledBy="sg-actions">
        <SectionHeader index={3} eyebrow="Actions" title="Buttons and links" id="sg-actions" />
        <div className="mt-12 flex flex-wrap items-center gap-6">
          <Button href="/membership">Primary</Button>
          <Button href="/membership" variant="secondary">
            Secondary
          </Button>
          <Button href="https://example.org" external>
            External
          </Button>
          <ApplyButton />
          <TextLink href="/membership" arrow>
            How membership works
          </TextLink>
          <TextLink href="https://example.org" external arrow>
            External link
          </TextLink>
        </div>
      </Section>

      <Section tone="white" labelledBy="sg-data">
        <SectionHeader index={4} eyebrow="Data" title="Stats and cards" lead="Missing values are dropped, never padded." id="sg-data" />
        <div className="mt-12">
          <StatRow
            stats={[
              { value: "120+", label: "Active members" },
              { value: "2019", label: "Founded" },
              { value: "8", label: "Partner firms" },
            ]}
          />
        </div>
        <Grid className="mt-16 gap-y-6">
          <div className="col-span-12 md:col-span-4">
            <Card>
              <Eyebrow>Upcoming</Eyebrow>
              <h3 className="mt-3 text-h3">Mock trading night</h3>
              <p className="mt-2 text-body tabular">Thu, Oct 16 · 7:00 PM</p>
              <p className="mt-1 text-caption text-ink-3">Gardner Hall 105</p>
            </Card>
          </div>
        </Grid>
      </Section>

      <Section labelledBy="sg-motif">
        <SectionHeader index={5} eyebrow="Motifs" title="Random walk and reveal" id="sg-motif" />
        <Reveal className="mt-12 grid grid-cols-12 gap-6">
          <div className="relative col-span-12 h-72 md:col-span-7">
            <div aria-hidden="true" className="graph-paper absolute inset-0" />
            <RandomWalk seed={7} paths={5} size="hero" className="relative h-full w-full" />
          </div>
          <div className="col-span-12 h-48 md:col-span-5">
            <RandomWalk seed={42} paths={3} size="header" className="h-full w-full" />
          </div>
        </Reveal>
        <VolSurfaceFigure className="mt-16" />
      </Section>

      <CTABand title="Ready to start?" lead="The footer's CTA zone: the one navy band on every page except /apply." />
    </>
  );
}
