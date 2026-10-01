import Link from "next/link";
import { getApplyTarget } from "@/components/ApplyButton";
import { Container, Grid } from "@/components/Container";
import { TextLink } from "@/components/TextLink";
import { Wordmark } from "@/components/Wordmark";
import { primaryNav } from "@/content/nav";
import { site } from "@/content/site";

/** Black footer with bone text (00 §10). Contact and social links render only when provided. */
export function SiteFooter() {
  const apply = getApplyTarget();
  const year = new Date().getFullYear();
  const { contactEmail, social, disclaimer } = site;

  return (
    <footer className="on-dark bg-black text-bone">
      <Container className="py-16 md:py-20">
        <Grid className="gap-y-12">
          <div className="col-span-12 md:col-span-5">
            <Wordmark tone="inverse" />
            <p className="mt-5 max-w-[36ch] text-body">{site.mission}</p>
          </div>

          <nav aria-label="Footer" className="col-span-6 md:col-span-3 md:col-start-7">
            <ul className="flex flex-col gap-3 text-nav">
              <li>
                <Link href="/" className="hover:underline hover:underline-offset-4">
                  Home
                </Link>
              </li>
              {primaryNav.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:underline hover:underline-offset-4">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <TextLink href={apply.href} external={apply.external} tone="inverse" arrow={apply.external}>
                  Apply
                </TextLink>
              </li>
            </ul>
          </nav>

          {contactEmail || social.instagram || social.linkedin ? (
            <div className="col-span-6 md:col-span-3">
              <ul className="flex flex-col gap-3 text-nav">
                {contactEmail ? (
                  <li>
                    <TextLink href={`mailto:${contactEmail}`} tone="inverse">
                      {contactEmail}
                    </TextLink>
                  </li>
                ) : null}
                {social.instagram ? (
                  <li>
                    <TextLink href={social.instagram} external arrow tone="inverse">
                      Instagram
                    </TextLink>
                  </li>
                ) : null}
                {social.linkedin ? (
                  <li>
                    <TextLink href={social.linkedin} external arrow tone="inverse">
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
