import Link from "next/link";
import { ListHeader } from "@/components/admin/ListPage";
import { SavedFromParam } from "@/components/admin/SavedFromParam";
import { listEvents } from "@/lib/admin/settings-db";
import { requirePage } from "@/lib/auth/admin";
import { parseEasternDateTime } from "@/lib/eastern-time";
import { eventTypeLabel, formatEventWhen } from "@/lib/events";

export const metadata = { title: "Events" };

const AUDIENCE = { public: "Website and portal", signed_in: "Portal · signed in", members: "Portal · members" } as const;

/** Events with Upcoming and Past tabs (spec 06 §6.10). */
export default async function EventsPage({ searchParams }: PageProps<"/admin/events">) {
  await requirePage();
  const [q, rows] = await Promise.all([searchParams, listEvents()]);
  const past = q.tab === "past";
  const now = new Date();
  const ended = (e: (typeof rows)[number]) => parseEasternDateTime(e.endsAt ?? e.startsAt) < now;
  const shown = rows.filter((e) => ended(e) === past);
  if (past) shown.reverse();
  return (
    <>
      <ListHeader title="Events" intro="Meetings, workshops, speakers, competitions and recruiting dates. Home shows the next featured website event automatically." addHref="/admin/events/new" addLabel="Add event" />
      <nav aria-label="Events sections" className="mt-8 flex gap-1 border-b border-rule">
        {[
          ["upcoming", "Upcoming", "/admin/events"],
          ["past", "Past", "/admin/events?tab=past"],
        ].map(([key, label, href]) => (
          <Link
            key={key}
            href={href}
            aria-current={(key === "past") === past ? "page" : undefined}
            className={`-mb-px min-h-11 content-center border-b-2 px-3 text-nav font-medium ${(key === "past") === past ? "border-navy text-navy" : "border-transparent text-ink-2 hover:text-navy"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {shown.length === 0 ? (
        <p className="mt-6 text-ink-3">{past ? "No past events." : "Nothing coming up. Add the next meeting."}</p>
      ) : (
        <ul className="mt-4 divide-y divide-rule border-y border-rule">
          {shown.map((e) => (
            <li key={e.id} className="py-3">
              <Link href={`/admin/events/${e.id}`} className="block min-h-11 hover:underline">
                <span className="block text-body text-black">
                  {e.title}
                  {e.featured ? <span className="ml-2 rounded-full bg-wash px-2 py-0.5 text-caption text-navy">On Home</span> : null}
                </span>
                <span className="block text-caption text-ink-3">
                  {formatEventWhen({ startsAt: e.startsAt, endsAt: e.endsAt ?? undefined })} · {eventTypeLabel(e.type)} · {AUDIENCE[e.audience]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <SavedFromParam saved={q.saved} viewHref="/" />
    </>
  );
}
