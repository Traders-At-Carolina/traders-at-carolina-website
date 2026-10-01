import { Button } from "@/components/Button";
import { CTABand } from "@/components/CTABand";
import { ByTheNumbers } from "@/components/home/ByTheNumbers";
import { Hero } from "@/components/home/Hero";
import { InsideTheClub } from "@/components/home/InsideTheClub";
import { Pillars } from "@/components/home/Pillars";
import type { StatItem } from "@/components/Stat";
import type { HomeContent, Recruiting } from "@/content/types";
import { getApplicationState } from "@/lib/applications";
import { homeApplyCopy, isUpcoming, numberSections } from "@/lib/home";

type HomePageProps = {
  home: HomeContent;
  recruiting: Recruiting;
  /** Build time for the static page; injectable for tests. */
  now: Date;
};

type SectionKey = "hero" | "pillars" | "numbers" | "inside";

/** Composes the Home page (spec 01 §2). Sections without real content are omitted and numbering stays sequential. */
export function HomePage({ home, recruiting, now }: HomePageProps) {
  const apply = homeApplyCopy(getApplicationState(now, recruiting), recruiting, now);

  const { members, foundedYear, partnerFirms } = home.stats;
  const stats: StatItem[] = [
    { value: members !== undefined ? `${members}+` : undefined, label: "Active members" },
    { value: foundedYear !== undefined ? String(foundedYear) : undefined, label: "Founded" },
    { value: partnerFirms !== undefined ? String(partnerFirms) : undefined, label: "Partner firms" },
  ];
  const showNumbers = stats.some((s) => s.value);
  const showInside = home.photos.length >= 2;
  const upcoming = home.upcoming && isUpcoming(home.upcoming.date, now) ? home.upcoming : undefined;

  const keys: SectionKey[] = ["hero", "pillars"];
  if (showNumbers) keys.push("numbers");
  if (showInside) keys.push("inside");
  const n = numberSections(keys);

  return (
    <>
      <Hero hero={home.hero} index={n.hero} apply={apply.hero} />
      <Pillars index={n.pillars} title={home.headings.pillars} pillars={home.pillars} />
      {showNumbers ? <ByTheNumbers index={n.numbers} title={home.headings.numbers} stats={stats} /> : null}
      {showInside ? (
        <InsideTheClub index={n.inside} title={home.headings.inside} photos={home.photos} upcoming={upcoming} />
      ) : null}
      <CTABand
        title={apply.band.title}
        action={
          <Button href={apply.band.href} external={apply.band.external} variant="inverse">
            {apply.band.label}
          </Button>
        }
      />
    </>
  );
}
