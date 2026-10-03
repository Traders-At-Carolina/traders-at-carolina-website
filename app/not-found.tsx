import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { Eyebrow } from "@/components/Eyebrow";
import { SiteChrome } from "@/components/SiteChrome";
import { TextLink } from "@/components/TextLink";
import { Bit404 } from "@/components/notfound/Bit404";
import { getPlacements } from "@/lib/data/public";

export const metadata: Metadata = { title: "Page not found" };

/**
 * Unmatched URLs render under the root layout only, so this page brings the site chrome itself. The 3D bit "404"
 * (spec 10) is decorative; the eyebrow, heading and link carry the message.
 */
export default async function NotFound() {
  const { wall } = await getPlacements();
  return (
    <SiteChrome wall={wall}>
      {/* One screen: the section fills the viewport below the 64 / 80px header and the figure takes what's left. */}
      <Container className="flex min-h-[calc(100svh-4rem)] flex-col justify-center py-10 md:min-h-[calc(100svh-5rem)] md:py-12">
        <Eyebrow>Error 404</Eyebrow>
        <Bit404 className="mt-4 md:mt-6" />
        <h1 className="mt-4 text-h1 md:mt-6">This page isn&apos;t here.</h1>
        <p className="mt-4 max-w-prose text-lead text-ink-2">
          The link may be out of date, or the page hasn&apos;t been published yet.
        </p>
        <p className="mt-6">
          <TextLink href="/" arrow>
            Back to the home page
          </TextLink>
        </p>
      </Container>
    </SiteChrome>
  );
}
