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
 * § 01 — the club's name and how to join, beside "Fig. 1": an interactive random-walk
 * figure on graph paper (spec 01 §3.1). On desktop the text sits on the left and the
 * figure on the right; on smaller screens the text comes first. Only the figure is a client island.
 */
export function Hero({ hero, index, apply }: HeroProps) {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div aria-hidden="true" className="graph-paper absolute inset-0" />
      <Container className="relative flex flex-col justify-center pt-12 pb-14 md:pt-16 md:pb-20 lg:min-h-[clamp(600px,calc(100svh-5rem),820px)] lg:py-16">
        <Grid className="gap-y-12 lg:items-center">
          <div className="col-span-12 lg:col-span-6 lg:col-start-1 lg:row-start-1 xl:pr-6">
            <Eyebrow index={index} className="text-[0.8125rem] md:text-[0.875rem]">
              {hero.eyebrow}
            </Eyebrow>
            <h1 id="hero-title" className="mt-5 text-hero">
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
          <HeroFigure caption={hero.figureCaption} className="col-span-12 lg:col-span-6 lg:col-start-7 lg:row-start-1" />
        </Grid>
      </Container>
    </section>
  );
}
