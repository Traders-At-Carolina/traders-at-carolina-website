import type { Metadata } from "next";
import { ApplyPage } from "@/components/apply/ApplyPage";
import { apply } from "@/content/apply";
import { events } from "@/content/events";
import { site } from "@/content/site";
import { getApplicationState } from "@/lib/applications";
import { formatWeekdayMonthDay } from "@/lib/format";
import { validateApply } from "@/lib/validate-apply";
import { validateEvents } from "@/lib/validate-events";

validateApply(apply);
validateEvents(events);

const state = getApplicationState(new Date(), site.recruiting);

export const metadata: Metadata = {
  title: "Apply",
  alternates: { canonical: "/apply" },
  description:
    state.status === "open" && site.recruiting.cycleLabel && state.deadline
      ? `Applications for ${site.recruiting.cycleLabel} are open through ${formatWeekdayMonthDay(state.deadline)}.`
      : "Learn how to join Traders at Carolina and get notified when applications open.",
};

export default function Page() {
  return <ApplyPage apply={apply} recruiting={site.recruiting} contactEmail={site.contactEmail} events={events} social={site.social} now={new Date()} />;
}
