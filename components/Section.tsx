import type { ReactNode } from "react";
import { Container, Grid } from "@/components/Container";
import { Eyebrow } from "@/components/Eyebrow";

type SectionProps = {
  children: ReactNode;
  /** Bone by default; white for the occasional contrast section (00 §6). */
  tone?: "bone" | "white";
  id?: string;
  labelledBy?: string;
  className?: string;
};

/** Page section with standard vertical rhythm: 64px mobile, 96px tablet, 128px desktop. */
export function Section({ children, tone = "bone", id, labelledBy, className = "" }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`${tone === "white" ? "bg-white" : "bg-bone"} py-16 md:py-24 lg:py-32 ${className}`}
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
};

/** Hairline, eyebrow, H2 and optional lead within the 7-column text span (00 §10). */
export function SectionHeader({ index, eyebrow, title, lead, id }: SectionHeaderProps) {
  return (
    <Grid className="border-t border-rule pt-6 md:pt-8">
      <div className="col-span-12 lg:col-span-7">
        <Eyebrow index={index}>{eyebrow}</Eyebrow>
        <h2 id={id} className="mt-4 text-h2">
          {title}
        </h2>
        {lead ? <p className="mt-4 text-lead text-ink-2">{lead}</p> : null}
      </div>
    </Grid>
  );
}
