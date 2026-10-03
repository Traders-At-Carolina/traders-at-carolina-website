import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { Eyebrow } from "@/components/Eyebrow";
import { SiteChrome } from "@/components/SiteChrome";
import { TextLink } from "@/components/TextLink";
import { Bit404 } from "@/components/notfound/Bit404";

export const metadata: Metadata = { title: "Page not found" };

/**
 * Unmatched URLs render under the root layout only, so this page brings the site chrome itself. The 3D bit "404"
 * (spec 10) is decorative; the eyebrow, heading and link carry the message.
 */
export default function NotFound() {
  return (
    <SiteChrome>
      <Container className="py-24 md:py-32">
        <Eyebrow>Error 404</Eyebrow>
        <Bit404 className="mt-8 md:mt-10" />
        <h1 className="mt-8 text-h1">This page isn&apos;t here.</h1>
        <p className="mt-6 max-w-prose text-lead text-ink-2">
          The link may be out of date, or the page hasn&apos;t been published yet.
        </p>
        <p className="mt-8">
          <TextLink href="/" arrow>
            Back to the home page
          </TextLink>
        </p>
      </Container>
    </SiteChrome>
  );
}
