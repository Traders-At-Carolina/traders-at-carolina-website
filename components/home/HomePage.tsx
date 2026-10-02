import type { ReactNode } from "react";
import { Button } from "@/components/Button";
import { CTABand } from "@/components/CTABand";
import { DeadlineSwitch } from "@/components/DeadlineSwitch";
import { ByTheNumbers } from "@/components/home/ByTheNumbers";
import { Hero, HeroActions } from "@/components/home/Hero";
import { InsideTheClub } from "@/components/home/InsideTheClub";
import { IntroOverlay } from "@/components/home/IntroOverlay";
import { Pillars } from "@/components/home/Pillars";
import type { StatItem } from "@/components/Stat";
import type { HomeContent, Partner, Recruiting } from "@/content/types";
import { getApplicationState, type ApplicationState } from "@/lib/applications";
import { homeApplyCopy, isUpcoming, numberSections, type HomeApplyCopy } from "@/lib/home";

type HomePageProps = {
  home: HomeContent;
  recruiting: Recruiting;
  /** Sponsors, already sorted, from the About partner list. */
  sponsors?: Pick<Partner, "name" | "logo">[];
  /** Build time for the static page; injectable for tests. */
  now: Date;
};

type SectionKey = "hero" | "pillars" | "numbers" | "inside";

/**
 * Composes the Home page (spec 01 §2). Sections without real content are omitted and numbering stays sequential.
 * When open with a deadline, the hero actions and band render both variants and DeadlineSwitch flips them
 * in the browser once it passes, matching /apply.
 */
export function HomePage({ home, recruiting, sponsors = [], now }: HomePageProps) {
  const state = getApplicationState(now, recruiting);
  const copy = (s: ApplicationState) => homeApplyCopy(s, recruiting, now);
  const deadline = state.status === "open" ? state.deadline : undefined;
  const live = (render: (c: HomeApplyCopy) => ReactNode) =>
    deadline ? (
      <DeadlineSwitch deadline={deadline.toISOString()} before={render(copy(state))} after={render(copy({ status: "closed" }))} />
    ) : (
      render(copy(state))
    );

  const { members, foundedYear, partnerFirms } = home.stats;
  const stats: StatItem[] = [
    { value: members !== undefined ? `${members}+` : undefined, label: "Active members", phrase: `${members}+ active members` },
    { value: foundedYear !== undefined ? String(foundedYear) : undefined, label: "Founded", phrase: `Founded in ${foundedYear}` },
    // The named sponsor list replaces the bare count when it's available.
    { value: partnerFirms !== undefined && sponsors.length === 0 ? String(partnerFirms) : undefined, label: "Partner firms", phrase: `${partnerFirms} partner firms` },
  ];
  const showNumbers = stats.some((s) => s.value) || sponsors.length > 0;
  const showInside = home.photos.length >= 2;
  const upcoming = home.upcoming && isUpcoming(home.upcoming.date, now) ? home.upcoming : undefined;

  const keys: SectionKey[] = ["hero", "pillars"];
  if (showNumbers) keys.push("numbers");
  if (showInside) keys.push("inside");
  const n = numberSections(keys);

  return (
    <>
      <IntroOverlay />
      <Hero hero={home.hero} index={n.hero} actions={<div aria-live="polite">{live((c) => <HeroActions apply={c.hero} />)}</div>} />
      <Pillars index={n.pillars} title={home.headings.pillars} pillars={home.pillars} />
      {showNumbers ? <ByTheNumbers index={n.numbers} title={home.headings.numbers} stats={stats} sponsors={sponsors} /> : null}
      {showInside ? (
        <InsideTheClub index={n.inside} title={home.headings.inside} photos={home.photos} upcoming={upcoming} />
      ) : null}
      {live(({ band }) => (
        <CTABand
          title={band.title}
          lead={band.lead}
          action={
            <Button href={band.href} external={band.external} arrow={band.arrow} variant="inverse">
              {band.label}
            </Button>
          }
        />
      ))}
    </>
  );
}
