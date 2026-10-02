import Link from "next/link";
import { Section, SectionHeader } from "@/components/Section";
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

/** § 02 — native details/summary accordion on graphite, plus FAQPage JSON-LD (spec 05 §4.3, §7). */
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
      <SectionHeader index={2} eyebrow="FAQ" title="Common questions." id="faq-title" />
      <div className="mt-12 border-t border-rule md:mt-16">
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
      {contactEmail ? (
        <p className="mt-8 text-caption text-ink-3">
          Still have questions? Email <TextLink href={`mailto:${contactEmail}`}>{contactEmail}</TextLink>
        </p>
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </Section>
  );
}
