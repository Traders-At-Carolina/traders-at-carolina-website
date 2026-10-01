import type { ReactNode } from "react";
import { ApplyButton } from "@/components/ApplyButton";
import { Container, Grid } from "@/components/Container";

type CTABandProps = {
  title: ReactNode;
  lead?: ReactNode;
  /** Defaults to the shared Apply button in its inverse style. */
  action?: ReactNode;
  id?: string;
};

/** Full-bleed navy band — the page's single navy moment (00 §4.3, §10). */
export function CTABand({ title, lead, action, id = "cta-band" }: CTABandProps) {
  return (
    <section aria-labelledby={id} className="on-dark bg-navy text-white">
      <Container className="py-16 md:py-24">
        <Grid>
          <div className="col-span-12 lg:col-span-8">
            <h2 id={id} className="text-h2">
              {title}
            </h2>
            {lead ? <p className="mt-4 text-lead text-bone">{lead}</p> : null}
            <div className="mt-8">{action ?? <ApplyButton variant="inverse" />}</div>
          </div>
        </Grid>
      </Container>
    </section>
  );
}
