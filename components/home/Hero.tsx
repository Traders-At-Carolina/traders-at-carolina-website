import { Button } from "@/components/Button";
import { Container, Grid } from "@/components/Container";
import { Eyebrow } from "@/components/Eyebrow";
import { TextLink } from "@/components/TextLink";
import { HeroFigure } from "@/components/home/HeroFigure";
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

/**
 * § 01 — what the club is and how to join, set above "Fig. 1": an interactive random-walk
 * figure on graph paper (spec 01 §3.1). Text is server-rendered; only the figure is a client island.
 */
export function Hero({ hero, index, apply }: HeroProps) {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div aria-hidden="true" className="graph-paper absolute inset-0" />
      <Container className="relative flex flex-col pt-12 pb-14 md:pt-16 md:pb-20 lg:min-h-[clamp(640px,calc(100svh-5rem),880px)] lg:justify-between lg:pt-14 lg:pb-14">
        <Grid className="gap-y-8 lg:items-end">
          <div className="col-span-12 lg:col-span-7">
            <Eyebrow index={index}>Quantitative finance at UNC</Eyebrow>
            <h1 id="hero-title" className="mt-5 text-hero">
              <Headline headline={hero.headline} emphasis={hero.headlineEmphasis} />
            </h1>
          </div>
          <div className="col-span-12 md:col-span-9 lg:col-span-5 lg:pb-2 xl:pl-8">
            <p className="text-lead text-ink-2">{hero.subhead}</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-5">
              <Button href={apply.href} external={apply.external} arrow={apply.arrow} className="w-full sm:w-auto">
                {apply.label}
              </Button>
              <TextLink href="/membership" arrow className="whitespace-nowrap">
                How membership works
              </TextLink>
            </div>
          </div>
        </Grid>
        <HeroFigure caption={hero.figureCaption} className="mt-12 md:mt-14 lg:mt-10" />
      </Container>
    </section>
  );
}
