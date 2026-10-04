import Link from "next/link";
import type { ReactNode } from "react";
import { getApplyTarget } from "@/components/ApplyButton";
import { Button } from "@/components/Button";
import { Container, Grid } from "@/components/Container";
import { CTABand } from "@/components/CTABand";
import { DeadlineSwitch } from "@/components/DeadlineSwitch";
import { InstagramIcon } from "@/components/InstagramIcon";
import { LinkedInIcon } from "@/components/LinkedInIcon";
import { BitWordmark } from "@/components/footer/BitWordmark";
import { PlacementWall } from "@/components/team/PlacementWall";
import { TextLink } from "@/components/TextLink";
import { Wordmark } from "@/components/Wordmark";
import { primaryNav } from "@/content/nav";
import { placementWall } from "@/content/placement-wall";
import { site } from "@/content/site";
import type { CompanyMark, Site } from "@/content/types";
import { ctaFromLabel, trackAttrs } from "@/lib/analytics/attributes";
import { getApplicationState, type ApplicationState } from "@/lib/applications";
import { homeApplyCopy } from "@/lib/home";

const listClasses = "flex flex-col text-nav md:gap-3";
const itemClasses = "flex min-h-11 items-center md:block md:min-h-0";
const headingClasses = "mb-3 text-eyebrow font-medium uppercase text-bone/70 md:mb-5";
const navLinkClasses = "max-md:hit-target hover:underline hover:underline-offset-4";
const SIGN_UP_LABEL = "Keep me posted";
const socialIconClasses = "mr-2 inline-block size-4 align-[-0.15em]";

type SiteFooterProps = {
  /** Club settings; defaults to content/site.ts. Injectable for tests. */
  settings?: Site;
  /** Firms for the strip; defaults to content/placement-wall.ts. Empty omits the strip. */
  wall?: CompanyMark[];
  /** Build time for the static page; injectable for tests. */
  now?: Date;
};

/**
 * The site's closing section (spec 07): a navy CTA zone, then a black base with the link grid, the placement strip
 * and the legal row. Rendered once by the root layout and identical on every page. Every action
 * carries the spec 06 §7.1 tracking attributes.
 */
export function SiteFooter({ settings = site, wall = placementWall, now = new Date() }: SiteFooterProps) {
  const { recruiting, contactEmail, social, disclaimer, mission } = settings;
  const state = getApplicationState(now, recruiting);
  const apply = getApplyTarget(now, recruiting);
  const deadline = state.status === "open" ? state.deadline : undefined;
  const closedState: ApplicationState = { status: "closed" };
  const hasReach = Boolean(contactEmail || social.instagram || social.linkedin);

  /** Renders both variants and lets DeadlineSwitch flip to closed in the browser once the deadline passes (spec 05 §3). */
  const live = (render: (s: ApplicationState) => ReactNode) =>
    deadline ? <DeadlineSwitch deadline={deadline.toISOString()} before={render(state)} after={render(closedState)} /> : render(state);

  const ctaZone = (s: ApplicationState) => {
    const { band } = homeApplyCopy(s, recruiting, now);
    return (
      <CTABand
        id="footer-cta"
        title={band.title}
        lead={band.lead}
        action={
          <Button
            href={band.href}
            external={band.external}
            arrow={band.arrow}
            variant="inverse"
            track={{ cta: ctaFromLabel(band.label), placement: "band" }}
          >
            {band.label}
          </Button>
        }
      />
    );
  };

  const applyLink = (s: ApplicationState) => {
    const target = s.status === "open" ? { href: apply.href, external: apply.external } : { href: "/apply", external: false };
    return (
      <TextLink
        href={target.href}
        external={target.external}
        tone="inverse"
        arrow={target.external}
        className="max-md:hit-target"
        track={{ cta: "apply", placement: "footer" }}
      >
        Apply
      </TextLink>
    );
  };

  return (
    <footer className="on-dark bg-black text-bone">
      {live(ctaZone)}

      <Container className="pt-16 pb-8 md:pt-20 md:pb-12">
        <Grid className="gap-y-12">
          <div className="col-span-12 lg:col-span-5">
            <Wordmark tone="inverse" size="lg" />
            <p className="mt-5 max-w-[36ch] text-body">{mission}</p>
          </div>

          {/* Mirrors the header (00 §11). Rows are 44px tall on touch layouts, tighter from md up. */}
          <nav aria-label="Footer" className="col-span-6 md:col-span-4 lg:col-span-2 lg:col-start-7">
            <h2 className={headingClasses}>Club</h2>
            <ul className={listClasses}>
              {primaryNav.map((link) => (
                <li key={link.href} className={itemClasses}>
                  <Link
                    href={link.href}
                    className={navLinkClasses}
                    {...trackAttrs({ cta: "nav", target: link.label, placement: "footer" })}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-span-6 md:col-span-4 lg:col-span-2">
            <h2 id="footer-join" className={headingClasses}>
              Join
            </h2>
            <ul aria-labelledby="footer-join" className={listClasses}>
              <li className={itemClasses}>{live(applyLink)}</li>
              {recruiting.interestFormUrl ? (
                <li className={itemClasses}>
                  <TextLink
                    href={recruiting.interestFormUrl}
                    external
                    arrow
                    tone="inverse"
                    className="max-md:hit-target"
                    track={{ cta: ctaFromLabel(SIGN_UP_LABEL), placement: "footer" }}
                  >
                    {SIGN_UP_LABEL}
                  </TextLink>
                </li>
              ) : null}
            </ul>
          </div>

          {hasReach ? (
            <div className="col-span-12 md:col-span-4 lg:col-span-2">
              <h2 id="footer-reach" className={headingClasses}>
                Reach
              </h2>
              <ul aria-labelledby="footer-reach" className={listClasses}>
                {contactEmail ? (
                  <li className={`${itemClasses} [overflow-wrap:anywhere]`}>
                    <TextLink
                      href={`mailto:${contactEmail}`}
                      tone="inverse"
                      className="max-md:hit-target"
                      track={{ cta: "email", placement: "footer" }}
                    >
                      {contactEmail}
                    </TextLink>
                  </li>
                ) : null}
                {social.instagram ? (
                  <li className={itemClasses}>
                    <TextLink
                      href={social.instagram}
                      external
                      arrow
                      tone="inverse"
                      className="max-md:hit-target"
                      track={{ cta: "social", target: "Instagram", placement: "footer" }}
                    >
                      <InstagramIcon className={socialIconClasses} />
                      Instagram
                    </TextLink>
                  </li>
                ) : null}
                {social.linkedin ? (
                  <li className={itemClasses}>
                    <TextLink
                      href={social.linkedin}
                      external
                      arrow
                      tone="inverse"
                      className="max-md:hit-target"
                      track={{ cta: "social", target: "LinkedIn", placement: "footer" }}
                    >
                      <LinkedInIcon className={`${socialIconClasses} text-[#0A66C2]`} />
                      LinkedIn
                    </TextLink>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </Grid>

        {wall.length > 0 ? (
          <div className="mt-16 md:mt-20">
            <PlacementWall companies={wall} tone="inverse" />
          </div>
        ) : null}

        <div className="mt-16 flex flex-col gap-2 border-t border-rule-inverse pt-6 text-caption md:flex-row md:justify-between">
          <p className="tabular">© {now.getFullYear()} Traders at Carolina</p>
          {disclaimer ? <p className="max-w-[60ch]">{disclaimer}</p> : null}
          {/* Spec 06 §7.1: anonymous, cookieless analytics, so a notice instead of a consent banner. */}
          <p>This site uses privacy-respecting analytics. No cookies.</p>
        </div>
      </Container>

      {/* Decorative 0s-and-1s wordmark that closes the page (spec 08). Flush with the page end, so no bottom padding. */}
      <Container>
        <BitWordmark />
      </Container>
    </footer>
  );
}
