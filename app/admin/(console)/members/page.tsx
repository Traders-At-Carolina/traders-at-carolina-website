import { Download, Inbox, Plus, Search, UserRound } from "lucide-react";
import { AccountActions, RequestActions } from "@/components/admin/MemberRowActions";
import { RosterTable } from "@/components/admin/RosterTable";
import { SaveToast } from "@/components/admin/SaveToast";
import { Badge } from "@/components/admin/ui/Badge";
import { Button, ButtonLink, buttonClasses } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Banner, EmptyState } from "@/components/admin/ui/Feedback";
import { Field, Input, Select } from "@/components/admin/ui/Field";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { Tabs } from "@/components/admin/ui/Tabs";
import { getEntry } from "@/lib/admin/audit";
import { listAccounts } from "@/lib/admin/clerk-admins";
import { rosterFilter } from "@/lib/admin/members-filter";
import { listMembers, pendingRequests, rosterEmails, rosterUserIds } from "@/lib/admin/members-db";
import { requirePage } from "@/lib/auth/admin";
import { portalAccessSettings } from "@/lib/members/settings";
import { inviteAdmin } from "../admins/actions";
import { approveRequest, bulkMembers, declineRequest, makeMember } from "./actions";

export const metadata = { title: "Members" };

const asked = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" });
const day = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/New_York" });

/** Members (spec 06 §6.2): Roster, Requests and All accounts. Membership lives in the roster, never in Clerk. */
export default async function MembersPage({ searchParams }: PageProps<"/admin/members">) {
  await requirePage();
  const q = await searchParams;
  const params = new URLSearchParams(Object.entries(q).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])));
  const tab = q.tab === "requests" || q.tab === "accounts" ? q.tab : "roster";
  const filter = rosterFilter(params);
  const [requests, settings, onRoster, rows] = await Promise.all([pendingRequests(), portalAccessSettings(), rosterEmails(), tab === "roster" ? listMembers(filter) : Promise.resolve([])]);
  const saved = typeof q.saved === "string" && /^\d+$/.test(q.saved) ? await getEntry(Number(q.saved)) : undefined;
  const exportHref = `/api/admin/members/export${params.toString() ? `?${params}` : ""}`;

  return (
    <>
      <PageHeader
        title="Members"
        description="The roster decides who sees members-only portal content. Changes take effect on each person's next page load."
        actions={
          <>
            {tab === "roster" ? (
              // A plain <a>: the export is a file download from an API route, not a page.
              <a href={exportHref} className={buttonClasses({ variant: "secondary" })}>
                <Download aria-hidden className="size-4" />
                Export CSV <span className="text-ui-text-3 tabular-nums">({rows.length})</span>
              </a>
            ) : null}
            <ButtonLink href="/admin/members/add" variant="primary" icon={Plus}>
              Add members
            </ButtonLink>
          </>
        }
      />

      <Tabs
        label="Members sections"
        tabs={[
          { href: "/admin/members", label: "Roster", count: onRoster.size, current: tab === "roster" },
          { href: "/admin/members?tab=requests", label: "Requests", count: requests.length, current: tab === "requests" },
          { href: "/admin/members?tab=accounts", label: "All accounts", current: tab === "accounts" },
        ]}
      />

      {tab === "roster" ? (
        <Card>
          <form aria-label="Filter the roster" className="grid gap-3 border-b border-ui-border px-5 py-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto] lg:items-end">
            <Field label="Search" className="sm:col-span-2 lg:col-span-1">
              <Input name="q" defaultValue={filter.q ?? ""} placeholder="Name or email" />
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue={filter.status ?? ""}>
                <option value="">Any</option>
                <option value="active">Active</option>
                <option value="alumni">Alumni</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
            <Field label="Track">
              <Select name="track" defaultValue={filter.track ?? ""}>
                <option value="">Any</option>
                <option value="trading">Trading</option>
                <option value="research">Research</option>
                <option value="development">Development</option>
              </Select>
            </Field>
            <Field label="Class year">
              <Input name="year" inputMode="numeric" defaultValue={filter.classYear ?? ""} placeholder="2027" className="tabular-nums" />
            </Field>
            <Button type="submit" icon={Search}>
              Apply filters
            </Button>
          </form>
          {filter.classYear ? (
            <Banner tone="info" className="mx-5 mt-4">
              Year end: select all, then Mark alumni.
            </Banner>
          ) : null}
          <div className={filter.classYear ? "mt-4 border-t border-ui-border" : undefined}>
            <RosterTable
              rows={rows.map((r) => ({ id: r.id, name: r.name, email: r.email, status: r.status, track: r.track, classYear: r.classYear, cohort: r.cohort, signedUp: Boolean(r.userId) }))}
              action={bulkMembers}
              classYear={filter.classYear}
            />
          </div>
        </Card>
      ) : null}

      {tab === "requests" ? (
        !settings.acceptRequests ? (
          <Banner tone="info" title="Access requests are turned off">
            The portal hides the Request access button.
          </Banner>
        ) : requests.length === 0 ? (
          <Card>
            <EmptyState icon={Inbox} title="No requests waiting" description="New access requests from the portal show up here." />
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {requests.map((r) => (
              <Card as="li" key={r.id} className="flex flex-col justify-between gap-4 px-5 py-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <p className="text-ui-base font-medium text-ui-text">{r.name}</p>
                  <p className="mt-0.5 text-ui-hint text-ui-text-3">
                    {r.email} · asked <span className="tabular-nums">{asked.format(r.createdAt)}</span>
                  </p>
                  {r.note ? <p className="mt-2 max-w-prose border-l-2 border-ui-border pl-3 text-ui-base text-ui-text-2">“{r.note}”</p> : null}
                </div>
                <RequestActions id={r.id} name={r.name} approve={approveRequest} decline={declineRequest} />
              </Card>
            ))}
          </ul>
        )
      ) : null}

      {tab === "accounts" ? <Accounts /> : null}

      {saved ? <SaveToast state={{ ok: saved.action === "delete" ? `${saved.entityLabel} removed from the roster.` : `Added ${saved.entityLabel}.`, undoId: saved.id, at: saved.id }} /> : null}
    </>
  );
}

async function Accounts() {
  const [accounts, linked] = await Promise.all([listAccounts(), rosterUserIds()]);
  return (
    <Card>
      {accounts.length === 0 ? (
        <EmptyState icon={UserRound} title="No accounts yet" description="People appear here once they sign up on the site." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Joined</TH>
              <TH>Last signed in</TH>
              <TH className="text-right">
                <span className="sr-only">Actions</span>
              </TH>
            </TR>
          </THead>
          <TBody>
            {accounts.map((a) => {
              const member = linked.get(a.id);
              return (
                <TR key={a.id}>
                  <TD className="min-w-56">
                    <p className="flex flex-wrap items-center gap-1.5 font-medium text-ui-text">
                      {a.name}
                      {member ? <Badge tone="success">Member</Badge> : null}
                      {a.isAdmin ? <Badge tone="accent">Admin</Badge> : null}
                    </p>
                    <p className="text-ui-hint text-ui-text-3">{a.email ?? "No email"}</p>
                  </TD>
                  <TD className="whitespace-nowrap text-ui-text-2 tabular-nums">{day.format(a.createdAt)}</TD>
                  <TD className="whitespace-nowrap text-ui-text-2 tabular-nums">{a.lastSignInAt ? day.format(a.lastSignInAt) : <span className="text-ui-text-3">Never</span>}</TD>
                  <TD className="text-right">
                    <AccountActions userId={a.id} email={a.email} name={a.name} isMember={Boolean(member)} isAdmin={a.isAdmin} makeMember={makeMember} makeAdmin={inviteAdmin} />
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </Card>
  );
}
