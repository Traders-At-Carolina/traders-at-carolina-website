import type { ReactNode } from "react";
import { ApplyHeader } from "@/components/apply/ApplyHeader";
import { Faq } from "@/components/apply/Faq";
import { Process } from "@/components/apply/Process";
import { Button } from "@/components/Button";
import { CTABand } from "@/components/CTABand";
import { DeadlineSwitch } from "@/components/DeadlineSwitch";
import type { ApplyContent, Recruiting } from "@/content/types";
import { applyBandCopy, applyStatusCopy, stageDates } from "@/lib/apply";
import { getApplicationState, type ApplicationState } from "@/lib/applications";

type ApplyPageProps = {
  apply: ApplyContent;
  recruiting: Recruiting;
  contactEmail?: string;
  /** Build time for the static page; injectable for tests. */
  now: Date;
};

const processLead = (state: ApplicationState, cycleLabel?: string) =>
  state.status === "open" && cycleLabel
    ? `We recruit each fall and spring. Here's how the ${cycleLabel} cycle works.`
    : "We recruit each fall and spring. Here's how a typical cycle works.";

/**
 * Composes /apply (spec 05). When open with a deadline, each state-dependent part renders both
 * variants and DeadlineSwitch flips to the closed one in the browser once the deadline passes.
 */
export function ApplyPage({ apply, recruiting, contactEmail, now }: ApplyPageProps) {
  const state = getApplicationState(now, recruiting);
  const closedState: ApplicationState = { status: "closed" };

  const header = (s: ApplicationState) => <ApplyHeader copy={applyStatusCopy(s, recruiting, contactEmail, now)} />;
  const process = (s: ApplicationState) => (
    <Process stages={apply.stages} dates={stageDates(s, recruiting)} lead={processLead(s, recruiting.cycleLabel)} />
  );
  const band = (s: ApplicationState) => {
    const copy = applyBandCopy(s, recruiting, contactEmail);
    return (
      <CTABand
        title={copy.title}
        lead={copy.lead}
        action={
          <Button href={copy.action.href} external={copy.action.external} variant="inverse">
            {copy.action.label}
          </Button>
        }
      />
    );
  };

  const deadline = state.status === "open" ? state.deadline : undefined;
  const live = (render: (s: ApplicationState) => ReactNode) =>
    deadline ? <DeadlineSwitch deadline={deadline.toISOString()} before={render(state)} after={render(closedState)} /> : render(state);

  return (
    <>
      <div aria-live="polite">{live(header)}</div>
      {live(process)}
      <Faq faq={apply.faq} contactEmail={contactEmail} />
      {live(band)}
    </>
  );
}
