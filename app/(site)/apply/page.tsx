import type { Metadata } from "next";
import { ApplyPage } from "@/components/apply/ApplyPage";
import { apply } from "@/content/apply";
import { site } from "@/content/site";
import { getApplicationState } from "@/lib/applications";
import { getEvents, getRecruiting } from "@/lib/data/public";
import { formatWeekdayMonthDay } from "@/lib/format";
import { validateApply } from "@/lib/validate-apply";
import { validateEvents } from "@/lib/validate-events";

validateApply(apply);

/** The description follows the live recruiting state (spec 05 §7), regenerated with the page. */
export async function generateMetadata(): Promise<Metadata> {
  const recruiting = await getRecruiting();
  const state = getApplicationState(new Date(), recruiting);
  return {
    title: "Apply",
    alternates: { canonical: "/apply" },
    description:
      state.status === "open" && recruiting.cycleLabel && state.deadline
        ? `Applications for ${recruiting.cycleLabel} are open through ${formatWeekdayMonthDay(state.deadline)}.`
        : "Learn how to join Traders at Carolina and get notified when applications open.",
  };
}

/** Recruiting and events come from the admin (spec 06 §6.5, §6.10); the process and FAQ are content/apply.ts. */
export default async function Page() {
  const [recruiting, events] = await Promise.all([getRecruiting(), getEvents()]);
  validateEvents(events);
  return <ApplyPage apply={apply} recruiting={recruiting} contactEmail={site.contactEmail} events={events} social={site.social} now={new Date()} />;
}
