import type { ReactNode } from "react";
import { Container } from "@/components/Container";
import { Eyebrow } from "@/components/Eyebrow";
import { SectionRule } from "@/components/SectionRule";

type SectionProps = {
  children: ReactNode;
  /** Bone by default; graphite for the occasional contrast section (00 §6). White is kept for the styleguide. */
  tone?: "bone" | "white" | "graphite";
  id?: string;
  labelledBy?: string;
  /** Compact halves the rhythm (48 / 64px) for runs of short, related sections like the Team tiers. */
  density?: "default" | "compact";
  className?: string;
};

const tones = {
  bone: "bg-bone",
  white: "on-dark surface-graphite",
  graphite: "on-dark surface-graphite",
} as const;

/** Page section with standard vertical rhythm: 64px mobile, 96px tablet, 128px desktop. */
export function Section({ children, tone = "bone", id, labelledBy, density = "default", className = "" }: SectionProps) {
  return (
    <section
      id={id}
      data-tone={tone}
      aria-labelledby={labelledBy}
      // scroll-mt clears the sticky header (64 / 80px) when linked to by #id.
      className={`${tones[tone]} scroll-mt-16 md:scroll-mt-20 ${density === "compact" ? "py-12 md:py-16" : "py-16 md:py-24 lg:py-32"} ${className}`}
    >
      <Container>{children}</Container>
    </section>
  );
}

type SectionHeaderProps = {
  index?: number;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  /** id for the H2, so the section can reference it via aria-labelledby. */
  id?: string;
  /** Inverse for dark sections. */
  tone?: "default" | "inverse";
  /** Fill the parent's width instead of the 7-column text span, for a header set beside its content. */
  fullWidth?: boolean;
};

/** Drawn hairline, eyebrow, H2 and optional lead within the 7-column text span (00 §10). */
export function SectionHeader({ index, eyebrow, title, lead, id, tone = "default", fullWidth }: SectionHeaderProps) {
  return (
    <SectionRule inverse={tone === "inverse"}>
      <div className={fullWidth ? "col-span-12" : "col-span-12 lg:col-span-7"}>
        <Eyebrow index={index} tone={tone}>
          {eyebrow}
        </Eyebrow>
        <h2 id={id} className="mt-4 text-h2">
          {title}
        </h2>
        {lead ? <p className={`mt-4 text-lead ${tone === "inverse" ? "text-bone" : "text-ink-2"}`}>{lead}</p> : null}
      </div>
    </SectionRule>
  );
}
