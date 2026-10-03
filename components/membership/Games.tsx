import { ApplyButton } from "@/components/ApplyButton";
import { Button } from "@/components/Button";
import { Grid } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import { GameCard } from "@/components/membership/GameCard";

const PLACEMENT = "membership-games";
const INTERVIEW_HREF = "/apply#process";

type GamesProps = {
  index: number;
  title: string;
};

/**
 * § 03 — two short games that preview the thinking the club trains and the interview tests (spec 03 §3.7).
 * Graphite, the page's one dark band, so the games read as something to do rather than something to read. The interview
 * and Apply links are rendered here on the server and handed to the client card, so Apply resolves the same way it
 * does everywhere else.
 */
export function Games({ index, title }: GamesProps) {
  const cta = (
    <>
      <Button href={INTERVIEW_HREF} arrow variant="light" shape="rounded" track={{ cta: "game-interview", placement: PLACEMENT }}>
        See how interviews work
      </Button>
      <ApplyButton variant="light-outline" shape="rounded" placement={PLACEMENT} />
    </>
  );

  return (
    <Section id="games" tone="graphite" density="compact" labelledBy="games-title">
      {/* Header beside the card from 1024px, so the whole section fits one laptop screen. */}
      <Grid className="gap-y-10 md:gap-y-12">
        <div className="col-span-12 lg:col-span-4">
          <SectionHeader
            index={index}
            eyebrow="Try a problem"
            title={title}
            id="games-title"
            fullWidth
            lead="The kind of question you'll work through out loud in an interview. Nothing to sign up for; your best score stays in this browser."
          />
        </div>
        <Reveal className="col-span-12 lg:col-span-8">
          <GameCard cta={cta} />
        </Reveal>
      </Grid>
    </Section>
  );
}
