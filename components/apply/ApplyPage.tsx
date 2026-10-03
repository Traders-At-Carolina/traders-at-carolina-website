import type { ReactNode } from "react";
import { ApplyHeader } from "@/components/apply/ApplyHeader";
import { Faq } from "@/components/apply/Faq";
import { Process } from "@/components/apply/Process";
import { StickyApply } from "@/components/apply/StickyApply";
import { WhatYouGet } from "@/components/apply/WhatYouGet";
import { WhileYouWait } from "@/components/apply/WhileYouWait";
import { Button } from "@/components/Button";
import { DeadlineSwitch } from "@/components/DeadlineSwitch";
import type { ApplyContent, ClubEvent, Recruiting, Site } from "@/content/types";
import { ctaFromLabel } from "@/lib/analytics/attributes";
import { applyPrimaryAction, applyStatusCopy, processLead, stageDates, stageEfforts, visibleFaq, whileYouWait } from "@/lib/apply";
import { getApplicationState, type ApplicationState } from "@/lib/applications";

type ApplyPageProps = {
  apply: ApplyContent;
  recruiting: Recruiting;
  contactEmail?: string;
  /** content/events.ts; the next public event feeds the closed state's "Come to an event". */
  events?: ClubEvent[];
  social?: Site["social"];
  /** Build time for the static page; injectable for tests. */
  now: Date;
  /** Deployment environment for draft FAQ answers; defaults to VERCEL_ENV. */
  vercelEnv?: string;
};

/**
 * Composes /apply (spec 05): status header, a closed-state "until then" section, what you get, process, and FAQ. The closing navy band is the footer's CTA zone (spec 07).
 * When open with a deadline, each state-dependent part renders both variants and DeadlineSwitch
 * flips to the closed one in the browser once the deadline passes.
 */
export function ApplyPage({ apply, recruiting, contactEmail, events = [], social = {}, now, vercelEnv }: ApplyPageProps) {
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
  const sticky = (s: ApplicationState) => {
    const action = applyPrimaryAction(s, recruiting, contactEmail);
    return (
      <StickyApply>
        <Button
          href={action.href}
          external={action.external}
          fullWidth
          track={{ cta: ctaFromLabel(action.label), placement: "apply-sticky" }}
        >
          {action.label}
        </Button>
      </StickyApply>
    );
  };
  const wait = (s: ApplicationState) => (s.status === "closed" ? <WhileYouWait items={whileYouWait(events, social, now)} /> : null);
  const process = (s: ApplicationState) => (
    <Process
      stages={apply.stages}
      dates={stageDates(s, recruiting)}
      efforts={stageEfforts(apply.stages, recruiting)}
      lead={processLead(s, recruiting.cycleLabel)}
      current={s.status === "open" ? 0 : undefined}
    />
  );
  const deadline = state.status === "open" ? state.deadline : undefined;
  const live = (render: (s: ApplicationState) => ReactNode) =>
    deadline ? <DeadlineSwitch deadline={deadline.toISOString()} before={render(state)} after={render(closedState)} /> : render(state);

  return (
    <>
      <div aria-live="polite">{live(header)}</div>
      {live(sticky)}
      {live(wait)}
      <WhatYouGet benefits={apply.benefits} action={live(primary)} />
      {live(process)}
      <Faq faq={visibleFaq(apply.faq, vercelEnv)} contactEmail={contactEmail} />
    </>
  );
}
