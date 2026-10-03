import Link from "next/link";
import { buttonClasses } from "@/components/Button";
import { AccountActions, RequestActions } from "@/components/admin/MemberRowActions";
import { RosterTable } from "@/components/admin/RosterTable";
import { SaveToast } from "@/components/admin/SaveToast";
import { getEntry } from "@/lib/admin/audit";
import { listAccounts } from "@/lib/admin/clerk-admins";
import { rosterFilter } from "@/lib/admin/members-filter";
import { listMembers, pendingRequests, rosterUserIds } from "@/lib/admin/members-db";
import { requirePage } from "@/lib/auth/admin";
import { portalAccessSettings } from "@/lib/members/settings";
import { inviteAdmin } from "../admins/actions";
import { approveRequest, bulkMembers, declineRequest, makeMember } from "./actions";

export const metadata = { title: "Members" };

const asked = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" });
const day = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/New_York" });
const ctl = "mt-2 min-h-11 w-full border border-rule bg-white px-2 text-body";

/** Members (spec 06 §6.2): Roster, Requests and All accounts. Membership lives in the roster, never in Clerk. */
export default async function MembersPage({ searchParams }: PageProps<"/admin/members">) {
  await requirePage();
  const q = await searchParams;
  const params = new URLSearchParams(Object.entries(q).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])));
  const tab = q.tab === "requests" || q.tab === "accounts" ? q.tab : "roster";
  const [requests, settings] = await Promise.all([pendingRequests(), portalAccessSettings()]);
  const saved = typeof q.saved === "string" && /^\d+$/.test(q.saved) ? await getEntry(Number(q.saved)) : undefined;

  const tabs = [
    { key: "roster", label: "Roster" },
    { key: "requests", label: `Requests${requests.length ? ` (${requests.length})` : ""}` },
    { key: "accounts", label: "All accounts" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">Members</h1>
          <p className="mt-4 max-w-prose text-body text-ink-2">The roster decides who sees members-only portal content. Changes take effect on each person&apos;s next page load.</p>
        </div>
        <Link href="/admin/members/add" className={buttonClasses({})}>
          Add members
        </Link>
      </div>

      <nav aria-label="Members sections" className="mt-8 flex gap-1 border-b border-rule">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key === "roster" ? "/admin/members" : `/admin/members?tab=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className={`-mb-px min-h-11 content-center border-b-2 px-3 text-nav font-medium ${tab === t.key ? "border-navy text-navy" : "border-transparent text-ink-2 hover:text-navy"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "roster" ? <Roster params={params} /> : null}
        {tab === "requests" ? (
          !settings.acceptRequests ? (
            <p className="text-ink-2">Access requests are turned off, so the portal hides the Request access button.</p>
          ) : requests.length === 0 ? (
            <p className="text-ink-3">No requests waiting.</p>
          ) : (
            <ul className="divide-y divide-rule border-y border-rule">
              {requests.map((r) => (
                <li key={r.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row">
                  <div>
                    <p className="text-body text-black">{r.name}</p>
                    <p className="text-caption text-ink-3">
                      {r.email} · asked {asked.format(r.createdAt)}
                    </p>
                    {r.note ? <p className="mt-2 max-w-prose text-body text-ink-2">“{r.note}”</p> : null}
                  </div>
                  <RequestActions id={r.id} name={r.name} approve={approveRequest} decline={declineRequest} />
                </li>
              ))}
            </ul>
          )
        ) : null}
        {tab === "accounts" ? <Accounts /> : null}
      </div>

      {saved ? <SaveToast state={{ ok: saved.action === "delete" ? `${saved.entityLabel} removed from the roster.` : `Added ${saved.entityLabel}.`, undoId: saved.id, at: saved.id }} /> : null}
    </>
  );
}

async function Roster({ params }: { params: URLSearchParams }) {
  const filter = rosterFilter(params);
  const rows = await listMembers(filter);
  const exportHref = `/api/admin/members/export${params.toString() ? `?${params}` : ""}`;
  return (
    <>
      <form className="grid gap-4 sm:grid-cols-5" aria-label="Filter the roster">
        <label className="text-caption font-medium text-ink-2 sm:col-span-2">
          Search
          <input name="q" defaultValue={filter.q ?? ""} placeholder="Name or email" className={ctl} />
        </label>
        <label className="text-caption font-medium text-ink-2">
          Status
          <select name="status" defaultValue={filter.status ?? ""} className={ctl}>
            <option value="">Any</option>
            <option value="active">Active</option>
            <option value="alumni">Alumni</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="text-caption font-medium text-ink-2">
          Track
          <select name="track" defaultValue={filter.track ?? ""} className={ctl}>
            <option value="">Any</option>
            <option value="trading">Trading</option>
            <option value="research">Research</option>
            <option value="development">Development</option>
          </select>
        </label>
        <label className="text-caption font-medium text-ink-2">
          Class year
          <input name="year" inputMode="numeric" defaultValue={filter.classYear ?? ""} placeholder="2027" className={ctl} />
        </label>
        <div className="flex flex-wrap gap-6 sm:col-span-5">
          <button type="submit" className="min-h-11 text-caption font-medium text-navy underline underline-offset-4">
            Apply filters
          </button>
          <a href={exportHref} className="min-h-11 content-center text-caption font-medium text-navy underline underline-offset-4">
            Export CSV ({rows.length})
          </a>
        </div>
      </form>
      {filter.classYear ? <p className="mt-4 text-caption text-ink-2">Year end: select all, then Mark alumni.</p> : null}
      <div className="mt-6">
        <RosterTable
          rows={rows.map((r) => ({ id: r.id, name: r.name, email: r.email, status: r.status, track: r.track, classYear: r.classYear, cohort: r.cohort, signedUp: Boolean(r.userId) }))}
          action={bulkMembers}
          classYear={filter.classYear}
        />
      </div>
    </>
  );
}

async function Accounts() {
  const [accounts, linked] = await Promise.all([listAccounts(), rosterUserIds()]);
  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {accounts.map((a) => {
        const member = linked.get(a.id);
        return (
          <li key={a.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-body text-black">
                {a.name}
                {member ? <span className="ml-2 rounded-full bg-wash px-2 py-0.5 text-caption text-navy">Member</span> : null}
                {a.isAdmin ? <span className="ml-2 rounded-full bg-wash px-2 py-0.5 text-caption text-navy">Admin</span> : null}
              </p>
              <p className="text-caption text-ink-3">
                {a.email ?? "No email"} · joined {day.format(a.createdAt)} · {a.lastSignInAt ? `last signed in ${day.format(a.lastSignInAt)}` : "never signed in"}
              </p>
            </div>
            <AccountActions userId={a.id} email={a.email} name={a.name} isMember={Boolean(member)} isAdmin={a.isAdmin} makeMember={makeMember} makeAdmin={inviteAdmin} />
          </li>
        );
      })}
    </ul>
  );
}
