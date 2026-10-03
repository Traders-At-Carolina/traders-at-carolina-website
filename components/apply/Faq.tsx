import Link from "next/link";
import { Grid } from "@/components/Container";
import { Eyebrow } from "@/components/Eyebrow";
import { Section } from "@/components/Section";
import { TextLink } from "@/components/TextLink";
import type { ApplyContent } from "@/content/types";
import { inlineToPlainText, parseInline } from "@/lib/inline-markdown";

function Answer({ source }: { source: string }) {
  return (
    <>
      {parseInline(source).map((token, i) => {
        if (token.type === "text") return token.value;
        if (token.type === "em") return <em key={i}>{token.value}</em>;
        const external = token.href.startsWith("https://");
        return external ? (
          <a key={i} href={token.href} target="_blank" rel="noopener noreferrer" className="link-underline text-navy">
            {token.text}
          </a>
        ) : (
          <Link key={i} href={token.href} className="link-underline text-navy">
            {token.text}
          </Link>
        );
      })}
    </>
  );
}

/** § 03 — native details/summary accordion on graphite, plus FAQPage JSON-LD (spec 05 §4.3, §7). */
export function Faq({ faq, contactEmail }: { faq: ApplyContent["faq"]; contactEmail?: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: inlineToPlainText(item.answer) },
    })),
  };

  return (
    <Section tone="graphite" id="faq" labelledBy="faq-title" className="scroll-mt-20">
      {/* Two columns on desktop: the heading stays put while a short list of questions reads as deliberate, not sparse. */}
      <Grid className="gap-y-12 border-t border-rule pt-6 md:pt-8">
        <div className="col-span-12 lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Eyebrow index={3}>FAQ</Eyebrow>
            <h2 id="faq-title" className="mt-4 text-h2">
              Common questions.
            </h2>
            {contactEmail ? (
              <p className="mt-6 text-caption text-ink-3">
                Still have questions? Email <TextLink href={`mailto:${contactEmail}`}>{contactEmail}</TextLink>
              </p>
            ) : null}
          </div>
        </div>
        <div className="col-span-12 border-t border-rule lg:col-span-7 lg:col-start-6 lg:-mt-6 lg:border-t-0">
          {faq.map((item) => (
            <details key={item.question} className="group border-b border-rule">
              <summary className="flex min-h-11 cursor-pointer list-none items-baseline justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                <span className="font-display text-h3">{item.question}</span>
                <span aria-hidden="true" className="text-h3 text-navy">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">−</span>
                </span>
              </summary>
              <p className="max-w-prose pb-6 text-body text-ink-2">
                <Answer source={item.answer} />
              </p>
            </details>
          ))}
        </div>
      </Grid>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </Section>
  );
}
