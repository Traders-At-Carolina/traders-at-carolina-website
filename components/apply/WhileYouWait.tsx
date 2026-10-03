import { Reveal } from "@/components/Reveal";
import { Section, SectionHeader } from "@/components/Section";
import { TextLink } from "@/components/TextLink";
import type { WaitItem } from "@/lib/apply";

/** Closed state only: things to do before the next cycle, so the page isn't a dead end (spec 05 §4.2). */
export function WhileYouWait({ items }: { items: WaitItem[] }) {
  return (
    <Section id="while-you-wait" labelledBy="wait-title">
      <SectionHeader
        eyebrow="Until then"
        title="Make the most of the wait."
        lead="Applications aren't open right now, but there's plenty you can do to get closer to the club."
        id="wait-title"
      />
      <Reveal as="ul" className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 md:mt-16 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.title} className="flex flex-col border-t border-rule pt-6">
            <h3 className="text-h3">{item.title}</h3>
            <p className="mt-3 text-body text-ink-2">{item.body}</p>
            {item.links.length ? (
              <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                {item.links.map((link) => (
                  <TextLink key={link.href} href={link.href} external={link.external} arrow track={{ cta: "while-you-wait", target: link.label }}>
                    {link.label}
                  </TextLink>
                ))}
              </p>
            ) : null}
          </li>
        ))}
      </Reveal>
    </Section>
  );
}
