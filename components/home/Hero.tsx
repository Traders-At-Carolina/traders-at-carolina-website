import { Button } from "@/components/Button";
import { Container, Grid } from "@/components/Container";
import { Eyebrow } from "@/components/Eyebrow";
import { RandomWalk } from "@/components/RandomWalk";
import { TextLink } from "@/components/TextLink";
import type { HomeContent } from "@/content/types";
import type { HomeApplyCopy } from "@/lib/home";

type HeroProps = {
  hero: HomeContent["hero"];
  index: number;
  apply: HomeApplyCopy["hero"];
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

/** § 01 — what the club is and how to join, with the random walk on graph paper (spec 01 §3.1). */
export function Hero({ hero, index, apply }: HeroProps) {
  return (
    <section data-nav-hero aria-labelledby="hero-title" className="relative overflow-hidden lg:flex lg:min-h-[clamp(560px,calc(80vh-5rem),760px)] lg:items-center">
      <div aria-hidden="true" className="graph-paper absolute inset-0" />
      <Container className="relative py-14 md:py-20">
        <Grid className="items-center gap-y-10">
          <div className="col-span-12 md:col-span-7">
            <Eyebrow index={index}>Quantitative finance at UNC</Eyebrow>
            <h1 id="hero-title" className="mt-4 text-display">
              <Headline headline={hero.headline} emphasis={hero.headlineEmphasis} />
            </h1>
            <p className="mt-6 max-w-[34rem] text-lead text-ink-2">{hero.subhead}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-5">
              <Button href={apply.href} external={apply.external} arrow={apply.arrow} className="w-full sm:w-auto">
                {apply.label}
              </Button>
              <TextLink href="/membership" arrow className="whitespace-nowrap">
                How membership works
              </TextLink>
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <RandomWalk seed={2026} paths={5} size="hero" className="h-[120px] w-full md:h-64 lg:h-80" />
          </div>
        </Grid>
      </Container>
    </section>
  );
}
