import { count } from "drizzle-orm";
import { ArrowRight, CircleCheck, History, Inbox, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { LiveTile, NotConnectedBanner, OverviewVisitorTiles, TileSkeleton } from "@/components/admin/analytics/sections";
import { UndoButton } from "@/components/admin/UndoButton";
import { Badge, StatusPill } from "@/components/admin/ui/Badge";
import { ButtonLink } from "@/components/admin/ui/Button";
import { Card, CardHeader, StatTile } from "@/components/admin/ui/Card";
import { Banner, EmptyState } from "@/components/admin/ui/Feedback";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { latestIdsFor, recentChanges } from "@/lib/admin/audit";
import { healthChecks } from "@/lib/admin/health";
import { pendingRequestCount } from "@/lib/admin/members-db";
import { ADMIN_SCREENS } from "@/lib/admin/nav";
import { posthogEnv } from "@/lib/analytics/query";
import { recruitingStatus } from "@/lib/admin/recruiting-status";
import { listEvents } from "@/lib/admin/settings-db";
import { canUndoEntity } from "@/lib/admin/undo";
import { requirePage } from "@/lib/auth/admin";
import { getRecruiting } from "@/lib/data/public";
import { db } from "@/lib/db/client";
import { members } from "@/lib/db/schema";
import { parseEasternDateTime } from "@/lib/eastern-time";

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

const eventDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });
const eventTime = new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });

const settle = <T,>(p: Promise<T>) => p.then((v) => v, () => null);

/** Active and alumni counts from the roster. */
async function memberCounts() {
  const rows = await db().select({ status: members.status, n: count() }).from(members).groupBy(members.status);
  const by = Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
  return { active: by.active ?? 0, alumni: by.alumni ?? 0 };
}

/** The soonest event that hasn't started yet. */
async function nextEvent(now: Date) {
  const rows = await listEvents();
  return { event: rows.find((e) => parseEasternDateTime(e.startsAt).getTime() >= now.getTime()) ?? null };
}

/** Overview (spec 06 §6.1, spec 11 §5.2). Each block loads on its own and says so if it can't; the visitors row streams in on its own (phase E). */
export default async function AdminHome() {
  await requirePage();
  const now = new Date();
  const [changes, waiting, counts, recruiting, next, issues] = await Promise.all([
    settle(recentChanges()),
    settle(pendingRequestCount()),
    settle(memberCounts()),
    settle(getRecruiting()),
    settle(nextEvent(now)),
    settle(healthChecks(now)),
  ]);
  const latest = changes ? await latestIdsFor(changes).catch(() => new Set<number>()) : new Set<number>();
  const upcoming = next?.event ?? null;
  const status = recruiting ? recruitingStatus(now, recruiting) : null;
  const unavailable = <span className="text-ui-base font-normal text-ui-text-3">Unavailable</span>;

  return (
    <>
      <PageHeader title="Overview" description="Everything the public site and portal show, in one place." />

      <section aria-label="At a glance" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Members" value={counts ? counts.active : unavailable} sub={counts ? `${counts.alumni} alumni` : undefined} href="/admin/members" />
        <StatTile
          label="Access requests"
          value={waiting ?? unavailable}
          extra={waiting ? <StatusPill status="pending">Waiting for review</StatusPill> : waiting === 0 ? <span className="text-ui-label text-ui-text-3">Nothing waiting</span> : undefined}
          href="/admin/members?tab=requests"
        />
        <StatTile
          label="Recruiting"
          value={status ? <StatusPill status={status.pill}>{status.label}</StatusPill> : unavailable}
          sub={status?.detail ? <span className="first-letter:uppercase">{status.detail}</span> : undefined}
          href="/admin/recruiting"
        />
        <StatTile
          label="Next event"
          value={upcoming ? eventDay.format(parseEasternDateTime(upcoming.startsAt)) : next ? <span className="text-ui-base font-normal text-ui-text-3">None scheduled</span> : unavailable}
          sub={upcoming ? `${upcoming.title} · ${eventTime.format(parseEasternDateTime(upcoming.startsAt))}` : undefined}
          href={upcoming ? `/admin/events/${upcoming.id}` : "/admin/events"}
        />
      </section>

      {posthogEnv() ? (
        <section aria-label="Visitors" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Suspense fallback={<TileSkeleton />}>
            <LiveTile href="/admin/analytics" />
          </Suspense>
          <Suspense
            fallback={
              <>
                <TileSkeleton />
                <TileSkeleton />
              </>
            }
          >
            <OverviewVisitorTiles />
          </Suspense>
        </section>
      ) : (
        <section aria-label="Visitors" className="mb-6">
          <NotConnectedBanner />
        </section>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <Card aria-labelledby="attention" className="self-start">
          <CardHeader id="attention" title="Needs attention" description="Things that look wrong or hide part of the site." />
          {issues === null ? (
            <Banner tone="danger" className="m-5">
              Checks are unavailable right now.
            </Banner>
          ) : issues.length === 0 ? (
            <div className="flex items-center gap-3 px-6 py-6">
              <CircleCheck aria-hidden className="size-5 text-ui-success" />
              <p className="text-ui-base text-ui-text">All clear. Nothing needs fixing.</p>
            </div>
          ) : (
            <ul className="divide-y divide-ui-border">
              {issues.map((issue) => (
                <li key={issue.id}>
                  <Link href={issue.href} className="group flex items-start gap-3 px-6 py-3 transition-colors duration-150 hover:bg-ui-canvas">
                    <TriangleAlert aria-hidden className={`mt-0.5 size-4 shrink-0 ${issue.tone === "danger" ? "text-ui-danger" : "text-ui-warning"}`} />
                    <span className="flex-1 text-ui-base text-ui-text">{issue.message}</span>
                    <span className="flex shrink-0 items-center gap-1 text-ui-label font-medium text-ui-accent">
                      Fix
                      <ArrowRight aria-hidden className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
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
                  <li key={c.id} className="flex items-start gap-3 px-6 py-3">
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

        <Card aria-labelledby="shortcuts">
          <CardHeader id="shortcuts" title="Shortcuts" description="Jump to any screen." />
          <ul className="grid sm:grid-cols-2 xl:grid-cols-3">
            {ADMIN_SCREENS.map(({ href, label, description, icon: Icon }) => (
              <li key={href} className="border-t border-ui-border first:border-t-0 sm:nth-2:border-t-0 xl:nth-3:border-t-0">
                <Link href={href} className="group flex h-full items-start gap-3 px-6 py-4 transition-colors duration-150 hover:bg-ui-canvas">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-ui-full bg-ui-accent-soft text-ui-accent">
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
    </>
  );
}
