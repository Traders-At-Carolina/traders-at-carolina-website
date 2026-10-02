import { Button } from "@/components/Button";
import { Container, Grid } from "@/components/Container";
import { Eyebrow } from "@/components/Eyebrow";
import { RandomWalk } from "@/components/RandomWalk";
import { TextLink } from "@/components/TextLink";
import type { ReactNode } from "react";
import type { HomeContent } from "@/content/types";
import type { HomeApplyCopy } from "@/lib/home";

type HeroProps = {
  hero: HomeContent["hero"];
  index: number;
  /** Rendered by the caller so it can switch live at the application deadline. */
  actions: ReactNode;
};

function Headline({ headline, emphasis }: { headline: string; emphasis?: string }) {
  const at = emphasis ? headline.indexOf(emphasis) : -1;
  if (!emphasis || at < 0) return headline;
  return (
    <>
      {headline.slice(0, at)}
      <em>{emphasis}</em>
      {headline.slice(at + emphasis.length)}
    </>
  );
}

/** Apply button, membership link and, when closed, a one-line status so "can I join?" is answered up top. */
export function HeroActions({ apply }: { apply: HomeApplyCopy["hero"] }) {
  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
        <Button href={apply.href} external={apply.external} arrow={apply.arrow} className="w-full sm:w-auto">
          {apply.label}
        </Button>
        <TextLink href="/membership" arrow className="hit-target whitespace-nowrap">
          How membership works
        </TextLink>
      </div>
      {apply.status ? <p className="mt-4 text-caption text-ink-2">{apply.status}</p> : null}
    </>
  );
}

/** § 01 — what the club is and how to join, with the random walk on graph paper (spec 01 §3.1). */
export function Hero({ hero, index, actions }: HeroProps) {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden lg:flex lg:min-h-[clamp(560px,calc(80vh-5rem),760px)] lg:items-center">
      <div aria-hidden="true" className="graph-paper absolute inset-0" />
      <Container className="relative py-16 md:py-24">
        <Grid className="items-center gap-y-12">
          <div className="col-span-12 md:col-span-7">
            <Eyebrow index={index}>Quantitative finance at UNC</Eyebrow>
            <h1 id="hero-title" className="mt-4 text-display">
              <Headline headline={hero.headline} emphasis={hero.headlineEmphasis} />
            </h1>
            <p className="mt-6 max-w-[34rem] text-lead text-ink-2">{hero.subhead}</p>
            {actions}
          </div>
          {/* Decorative, like the walk itself; the caption tells non-quants it's a simulation, not a real chart. */}
          <figure aria-hidden="true" className="col-span-12 md:col-span-5">
            <RandomWalk seed={2026} paths={5} size="hero" className="h-32 w-full md:h-64 lg:h-80" />
            <figcaption className="mt-3 border-t border-rule pt-2 text-caption text-ink-3">
              Fig. 1 — Five simulated price paths (seeded random walks)
            </figcaption>
          </figure>
        </Grid>
      </Container>
    </section>
  );
}
