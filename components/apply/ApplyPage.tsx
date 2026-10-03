import type { ReactNode } from "react";
import { ApplyHeader } from "@/components/apply/ApplyHeader";
import { Faq } from "@/components/apply/Faq";
import { Process } from "@/components/apply/Process";
import { WhatYouGet } from "@/components/apply/WhatYouGet";
import { Button } from "@/components/Button";
import { CTABand } from "@/components/CTABand";
import { DeadlineSwitch } from "@/components/DeadlineSwitch";
import type { ApplyContent, Recruiting } from "@/content/types";
import { ctaFromLabel } from "@/lib/analytics/attributes";
import { applyBandCopy, applyPrimaryAction, applyStatusCopy, processLead, stageDates, stageEfforts, visibleFaq } from "@/lib/apply";
import { getApplicationState, type ApplicationState } from "@/lib/applications";

type ApplyPageProps = {
  apply: ApplyContent;
  recruiting: Recruiting;
  contactEmail?: string;
  /** Build time for the static page; injectable for tests. */
  now: Date;
  /** Deployment environment for draft FAQ answers; defaults to VERCEL_ENV. */
  vercelEnv?: string;
};

/**
 * Composes /apply (spec 05): status header, what you get, process, FAQ and the navy band.
 * When open with a deadline, each state-dependent part renders both variants and DeadlineSwitch
 * flips to the closed one in the browser once the deadline passes.
 */
export function ApplyPage({ apply, recruiting, contactEmail, now, vercelEnv }: ApplyPageProps) {
  const state = getApplicationState(now, recruiting);
  const closedState: ApplicationState = { status: "closed" };

  const header = (s: ApplicationState) => <ApplyHeader copy={applyStatusCopy(s, recruiting, contactEmail, now)} />;
  const primary = (s: ApplicationState) => {
    const action = applyPrimaryAction(s, recruiting, contactEmail);
    return (
      <Button
        href={action.href}
        external={action.external}
        variant="secondary"
        className="w-full sm:w-auto"
        track={{ cta: ctaFromLabel(action.label), placement: "apply-benefits" }}
      >
        {action.label}
      </Button>
    );
  };
  const process = (s: ApplicationState) => (
    <Process
      stages={apply.stages}
      dates={stageDates(s, recruiting)}
      efforts={stageEfforts(apply.stages, recruiting)}
      lead={processLead(s, recruiting.cycleLabel)}
      current={s.status === "open" ? 0 : undefined}
    />
  );
  const band = (s: ApplicationState) => {
    const copy = applyBandCopy(s, recruiting, contactEmail, now);
    return (
      <CTABand
        title={copy.title}
        lead={copy.lead}
        action={
          <Button
            href={copy.action.href}
            external={copy.action.external}
            variant="inverse"
            track={{ cta: ctaFromLabel(copy.action.label), placement: "band" }}
          >
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
      <WhatYouGet benefits={apply.benefits} action={live(primary)} />
      {live(process)}
      <Faq faq={visibleFaq(apply.faq, vercelEnv)} contactEmail={contactEmail} />
      {live(band)}
    </>
  );
}
