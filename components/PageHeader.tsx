import type { ReactNode } from "react";
import { Container, Grid } from "@/components/Container";
import { Eyebrow } from "@/components/Eyebrow";
import { RandomWalk } from "@/components/RandomWalk";

type PageHeaderProps = {
  /** Unnumbered page label, e.g. "About". */
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  /** Random-walk seed; give each page its own so the art differs. */
  seed?: number;
  /** Extra content under the lead (spec 05 status block). */
  children?: ReactNode;
};

/** Top of every non-Home page: grid texture, eyebrow, H1, lead and a small random walk (00 §10). */
export function PageHeader({ eyebrow, title, lead, seed = 1, children }: PageHeaderProps) {
  return (
    <header data-nav-hero className="relative overflow-hidden">
      <div aria-hidden="true" className="graph-paper absolute inset-0" />
      <Container className="relative py-16 md:py-24">
        <Grid className="items-center">
          <div className="col-span-12 md:col-span-7">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="mt-4 text-h1">{title}</h1>
            {lead ? <p className="mt-6 text-lead text-ink-2">{lead}</p> : null}
            {children ? <div className="mt-8">{children}</div> : null}
          </div>
          <div className="hidden md:col-span-5 md:block">
            <RandomWalk seed={seed} paths={3} size="header" className="h-48 w-full lg:h-56" />
          </div>
        </Grid>
      </Container>
    </header>
  );
}
