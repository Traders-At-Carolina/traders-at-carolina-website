import { ArrowRight, History, Inbox } from "lucide-react";
import Link from "next/link";
import { UndoButton } from "@/components/admin/UndoButton";
import { Badge } from "@/components/admin/ui/Badge";
import { ButtonLink } from "@/components/admin/ui/Button";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { Banner, EmptyState } from "@/components/admin/ui/Feedback";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { latestIdsFor, recentChanges } from "@/lib/admin/audit";
import { pendingRequestCount } from "@/lib/admin/members-db";
import { ADMIN_SCREENS } from "@/lib/admin/nav";
import { canUndoEntity } from "@/lib/admin/undo";
import { requirePage } from "@/lib/auth/admin";

export const metadata = { title: "Admin" };

const when = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" });
const relative = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

/** "5 minutes ago", "yesterday", or the date once it's over a week old. */
function timeAgo(at: Date, now = Date.now()) {
  const minutes = Math.round((at.getTime() - now) / 60000);
  if (minutes > -1) return "just now";
  if (minutes > -60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours > -24) return relative.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (days > -7) return relative.format(days, "day");
  return when.format(at);
}

/** Overview (spec 06 §6.1, spec 11 §5.2). Phase D adds the KPI row and health checks; phase E the visitor numbers. */
export default async function AdminHome() {
  await requirePage();
  const changes = await recentChanges().catch(() => null);
  const latest = changes ? await latestIdsFor(changes).catch(() => new Set<number>()) : new Set<number>();
  const waiting = await pendingRequestCount().catch(() => 0);

  return (
    <>
      <PageHeader title="Overview" description="Everything the public site and portal show, in one place." />

      {waiting ? (
        <Banner
          tone="warning"
          title={`${waiting} membership request${waiting === 1 ? "" : "s"} waiting`}
          action={
            <ButtonLink href="/admin/members?tab=requests" size="sm" variant="secondary">
              Review
            </ButtonLink>
          }
          className="mb-6"
        >
          People who signed in and asked for member access.
        </Banner>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <Card aria-labelledby="shortcuts">
          <CardHeader id="shortcuts" title="Shortcuts" description="Jump to any screen." />
          <ul className="grid gap-px overflow-hidden rounded-b-ui-lg bg-ui-border sm:grid-cols-2">
            {ADMIN_SCREENS.map(({ href, label, description, icon: Icon }) => (
              <li key={href} className="bg-ui-surface">
                <Link href={href} className="group flex h-full items-start gap-3 px-5 py-4 transition-colors duration-150 hover:bg-ui-canvas">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-ui-md bg-ui-accent-soft text-ui-accent">
                    <Icon aria-hidden className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 text-ui-base font-medium text-ui-text">
                      {label}
                      <ArrowRight aria-hidden className="size-3.5 -translate-x-1 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100" />
                    </span>
                    <span className="mt-0.5 block text-ui-label text-ui-text-2">{description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card aria-labelledby="recent-changes" className="self-start">
          <CardHeader
            id="recent-changes"
            title="Recent changes"
            description="The last ten saves, newest first."
            actions={
              <ButtonLink href="/admin/history" size="sm" variant="ghost" icon={History}>
                All history
              </ButtonLink>
            }
          />
          {changes === null ? (
            <Banner tone="danger" className="m-5">
              The change log is unavailable right now.
            </Banner>
          ) : changes.length === 0 ? (
            <EmptyState icon={Inbox} title="No changes yet" description="Saves from any editor show up here, each with Undo." />
          ) : (
            <ul className="divide-y divide-ui-border">
              {changes.map((c) => {
                const who = c.actorEmail ?? c.actorId;
                return (
                  <li key={c.id} className="flex items-start gap-3 px-5 py-3">
                    <span aria-hidden className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-ui-full bg-ui-subtle text-ui-hint font-semibold text-ui-text-2 uppercase">
                      {who.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-ui-base text-ui-text">
                        <Badge className="mr-2 align-middle">{c.action}</Badge>
                        <span className="font-medium">{c.entityLabel}</span>
                      </p>
                      <p className="mt-0.5 truncate text-ui-hint text-ui-text-3">
                        {who} ·{" "}
                        <time dateTime={c.at.toISOString()} title={when.format(c.at)} className="tabular-nums">
                          {timeAgo(c.at)}
                        </time>
                      </p>
                    </div>
                    {canUndoEntity(c.entity) && latest.has(c.id) && (c.before != null || c.after != null) ? <UndoButton entryId={c.id} label={`${c.action} ${c.entityLabel}`} /> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
