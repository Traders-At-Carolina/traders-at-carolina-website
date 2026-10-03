import Link from "next/link";
import { recentChanges } from "@/lib/admin/audit";
import { requirePage } from "@/lib/auth/admin";

export const metadata = { title: "Admin" };

const when = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" });

/** Overview (spec 06 §6.1). Usage tiles arrive with the analytics dashboard (phase 5). */
export default async function AdminHome() {
  await requirePage();
  const changes = await recentChanges().catch(() => null);
  return (
    <>
      <h1 className="text-h1">Overview</h1>
      <p className="mt-4 max-w-prose text-lead text-ink-2">
        Editors for photos, officers, tracks, sponsors and placements arrive next. Until then, manage admins and review game scores here.
      </p>
      <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
        <li>
          <Link href="/admin/admins" className="link-underline text-navy">
            Admins
          </Link>
        </li>
        <li>
          <Link href="/admin/games" className="link-underline text-navy">
            Game scores and contacts
          </Link>
        </li>
      </ul>

      <h2 className="mt-12 text-h2">Recent changes</h2>
      {changes === null ? (
        <p className="mt-4 text-ink-3">The change log is unavailable right now.</p>
      ) : changes.length === 0 ? (
        <p className="mt-4 text-ink-3">No changes yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-rule border-y border-rule">
          {changes.map((c) => (
            <li key={c.id} className="flex flex-wrap justify-between gap-2 py-3 text-body">
              <span>
                {c.actorEmail ?? c.actorId} · {c.action} · {c.entityLabel}
              </span>
              <time dateTime={c.at.toISOString()} className="text-caption text-ink-3 tabular">
                {when.format(c.at)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
