import { CalendarDays, Plus } from "lucide-react";
import Link from "next/link";
import { ListHeader } from "@/components/admin/ListPage";
import { SavedFromParam } from "@/components/admin/SavedFromParam";
import { EventRowActions } from "@/components/admin/SeasonForms";
import { Badge, StatusPill } from "@/components/admin/ui/Badge";
import { ButtonLink } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/Feedback";
import { TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { Tabs } from "@/components/admin/ui/Tabs";
import { listEvents } from "@/lib/admin/settings-db";
import { requirePage } from "@/lib/auth/admin";
import { parseEasternDateTime } from "@/lib/eastern-time";
import { eventTypeLabel, formatEventWhen } from "@/lib/events";
import { deleteEventAction, duplicateEvent } from "./actions";

export const metadata = { title: "Events" };

const AUDIENCE = { public: "Website and portal", signed_in: "Portal · signed in", members: "Portal · members" } as const;

/** Events with Upcoming and Past tabs (spec 06 §6.10). */
export default async function EventsPage({ searchParams }: PageProps<"/admin/events">) {
  await requirePage();
  const [q, rows] = await Promise.all([searchParams, listEvents()]);
  const past = q.tab === "past";
  const now = new Date();
  const ended = (e: (typeof rows)[number]) => parseEasternDateTime(e.endsAt ?? e.startsAt) < now;
  const pastCount = rows.filter(ended).length;
  const shown = rows.filter((e) => ended(e) === past);
  if (past) shown.reverse();
  return (
    <>
      <ListHeader title="Events" intro="Meetings, workshops, speakers, competitions and recruiting dates. Home shows the next featured website event automatically." addHref="/admin/events/new" addLabel="New event" />
      <Tabs
        label="Events sections"
        tabs={[
          { href: "/admin/events", label: "Upcoming", count: rows.length - pastCount, current: !past },
          { href: "/admin/events?tab=past", label: "Past", count: pastCount, current: past },
        ]}
      />
      <Card>
        {shown.length === 0 ? (
          past ? (
            <EmptyState icon={CalendarDays} title="No past events" description="Events move here once they end." />
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="Nothing coming up"
              description="Add the next meeting."
              action={
                <ButtonLink href="/admin/events/new" variant="primary" icon={Plus}>
                  New event
                </ButtonLink>
              }
            />
          )
        ) : (
          // Not the kit's <Table>: its overflow-x-auto frame would clip the row menus, so the frame only scrolls on phones.
          <div className="overflow-x-auto md:overflow-visible">
            <table className="w-full border-collapse text-left text-ui-base">
              <THead>
                <TR>
                  <TH>Date</TH>
                  <TH>Title</TH>
                  <TH>Type</TH>
                  <TH>Audience</TH>
                  <TH className="w-12">
                    <span className="sr-only">Actions</span>
                  </TH>
                </TR>
              </THead>
              <TBody>
                {shown.map((e) => (
                  <TR key={e.id} className="relative">
                    <TD className="whitespace-nowrap text-ui-text-2 tabular-nums">{formatEventWhen({ startsAt: e.startsAt, endsAt: e.endsAt ?? undefined })}</TD>
                    <TD>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/admin/events/${e.id}`} className="font-medium text-ui-text after:absolute after:inset-0 hover:text-ui-accent">
                          {e.title}
                        </Link>
                        {e.featured ? <StatusPill status="featured">On Home</StatusPill> : null}
                      </div>
                    </TD>
                    <TD>
                      <Badge>{eventTypeLabel(e.type)}</Badge>
                    </TD>
                    <TD>
                      <Badge tone={e.audience === "public" ? "accent" : "neutral"}>{AUDIENCE[e.audience]}</Badge>
                    </TD>
                    <TD className="relative z-10 text-right">
                      <EventRowActions id={e.id} title={e.title} duplicateAction={duplicateEvent} deleteAction={deleteEventAction.bind(null, e.id)} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </table>
          </div>
        )}
      </Card>
      <SavedFromParam saved={q.saved} viewHref="/" />
    </>
  );
}
