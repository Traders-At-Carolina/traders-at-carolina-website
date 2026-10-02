import Link from "next/link";
import { getApplyTarget } from "@/components/ApplyButton";
import { Container, Grid } from "@/components/Container";
import { DeadlineSwitch } from "@/components/DeadlineSwitch";
import { TextLink } from "@/components/TextLink";
import { Wordmark } from "@/components/Wordmark";
import { primaryNav } from "@/content/nav";
import { site } from "@/content/site";

const listClasses = "flex flex-col text-nav md:gap-3";
const itemClasses = "flex min-h-11 items-center md:block md:min-h-0";

/** Black footer with bone text (00 §10). Contact and social links render only when provided. */
export function SiteFooter() {
  const apply = getApplyTarget();
  const year = new Date().getFullYear();
  const { contactEmail, social, disclaimer } = site;
  const deadline = apply.state.status === "open" ? apply.state.deadline : undefined;
  const applyLink = (href: string, external: boolean) => (
    <TextLink href={href} external={external} tone="inverse" arrow={external} className="max-md:hit-target">
      Apply
    </TextLink>
  );

  return (
    <footer className="on-dark bg-black text-bone">
      <Container className="py-16 md:py-20">
        <Grid className="gap-y-12">
          <div className="col-span-12 md:col-span-5">
            <Wordmark tone="inverse" />
            <p className="mt-5 max-w-[36ch] text-body">{site.mission}</p>
          </div>

          {/* Mirrors the header (00 §11). Rows are 44px tall on touch layouts, tighter from md up. */}
          <nav aria-label="Footer" className="col-span-6 md:col-span-3 md:col-start-7">
            <ul className={listClasses}>
              {primaryNav.map((link) => (
                <li key={link.href} className={itemClasses}>
                  <Link href={link.href} className="max-md:hit-target hover:underline hover:underline-offset-4">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className={itemClasses}>
                {deadline ? (
                  <DeadlineSwitch deadline={deadline.toISOString()} before={applyLink(apply.href, apply.external)} after={applyLink("/apply", false)} />
                ) : (
                  applyLink(apply.href, apply.external)
                )}
              </li>
            </ul>
          </nav>

          {contactEmail || social.instagram || social.linkedin ? (
            <div className="col-span-6 md:col-span-3">
              <ul className={listClasses}>
                {contactEmail ? (
                  <li className={itemClasses}>
                    <TextLink href={`mailto:${contactEmail}`} tone="inverse" className="max-md:hit-target">
                      {contactEmail}
                    </TextLink>
                  </li>
                ) : null}
                {social.instagram ? (
                  <li className={itemClasses}>
                    <TextLink href={social.instagram} external arrow tone="inverse" className="max-md:hit-target">
                      Instagram
                    </TextLink>
                  </li>
                ) : null}
                {social.linkedin ? (
                  <li className={itemClasses}>
                    <TextLink href={social.linkedin} external arrow tone="inverse" className="max-md:hit-target">
                      LinkedIn
                    </TextLink>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </Grid>

        <div className="mt-16 flex flex-col gap-2 border-t border-rule-inverse pt-6 text-caption md:flex-row md:justify-between">
          <p className="tabular">© {year} Traders at Carolina</p>
          {disclaimer ? <p className="max-w-[60ch]">{disclaimer}</p> : null}
        </div>
      </Container>
    </footer>
  );
}
