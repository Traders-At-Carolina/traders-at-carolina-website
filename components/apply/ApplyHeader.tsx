import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { TextLink } from "@/components/TextLink";
import type { StatusCopy } from "@/lib/apply";

/** /apply header with the status block — the one PageHeader with an action (spec 05 §2, §4.1). */
export function ApplyHeader({ copy }: { copy: StatusCopy }) {
  return (
    <PageHeader eyebrow={copy.eyebrow} title={copy.title} seed={505}>
      {copy.statusLine ? <p className="-mt-2 font-medium text-navy tabular">{copy.statusLine}</p> : null}
      {copy.lead ? <p className="mt-4 text-lead text-ink-2">{copy.lead}</p> : null}
      <div data-track-location="apply-header" className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-5">
        {copy.action ? (
          <Button href={copy.action.href} external={copy.action.external} className="w-full sm:w-auto">
            {copy.action.label}
          </Button>
        ) : null}
        {copy.secondary ? (
          <TextLink href={copy.secondary.href} arrow className="whitespace-nowrap">
            {copy.secondary.label}
          </TextLink>
        ) : null}
      </div>
      {copy.note ? <p className="mt-4 text-caption text-ink-3">{copy.note}</p> : null}
    </PageHeader>
  );
}
