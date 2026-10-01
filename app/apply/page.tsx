import type { Metadata } from "next";
import { ApplyPage } from "@/components/apply/ApplyPage";
import { apply } from "@/content/apply";
import { site } from "@/content/site";
import { getApplicationState } from "@/lib/applications";
import { formatWeekdayMonthDay } from "@/lib/format";
import { validateApply } from "@/lib/validate-apply";

validateApply(apply);

const state = getApplicationState(new Date(), site.recruiting);

export const metadata: Metadata = {
  title: "Apply",
  description:
    state.status === "open" && site.recruiting.cycleLabel && state.deadline
      ? `Applications for ${site.recruiting.cycleLabel} are open through ${formatWeekdayMonthDay(state.deadline)}.`
      : "Learn how to join Traders at Carolina and get notified when applications open.",
};

export default function Page() {
  return <ApplyPage apply={apply} recruiting={site.recruiting} contactEmail={site.contactEmail} now={new Date()} />;
}
