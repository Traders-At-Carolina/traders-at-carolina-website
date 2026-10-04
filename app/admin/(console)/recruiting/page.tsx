import { count, eq } from "drizzle-orm";
import { ArrowUpRight } from "lucide-react";
import { MemberCountForm, RecruitingForm } from "@/components/admin/SeasonForms";
import { StatusPill } from "@/components/admin/ui/Badge";
import { Card, CardHeader, CardSection } from "@/components/admin/ui/Card";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { getSeasonSetting } from "@/lib/admin/lists-db";
import { recruitingStatus } from "@/lib/admin/recruiting-status";
import { requirePage } from "@/lib/auth/admin";
import { getRecruiting } from "@/lib/data/public";
import { parseEasternDateTime } from "@/lib/eastern-time";
import { db } from "@/lib/db/client";
import { members } from "@/lib/db/schema";
import { saveMemberCount, saveRecruiting } from "./actions";

export const metadata = { title: "Recruiting" };

const when = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });

const day = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" });
/** "YYYY-MM-DD" as a calendar day (noon UTC is the same day in Eastern time). */
const fmtDay = (v?: string) => (v ? day.format(new Date(`${v}T12:00:00Z`)) : undefined);
/** "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD" (23:59) in Eastern time. */
const fmtWhen = (v?: string) => (v ? `${when.format(parseEasternDateTime(v.length === 10 ? `${v}T23:59` : v))} ET` : undefined);

const PLACES = [
  { label: "Header Apply button", href: "/" },
  { label: "Home hero", href: "/" },
  { label: "Footer call to action", href: "/about" },
  { label: "Apply page", href: "/apply" },
  { label: "Membership games", href: "/membership#games" },
];

/** Recruiting and the Season card (spec 06 §6.5). */
export default async function RecruitingPage() {
  await requirePage();
  const [recruiting, season, active] = await Promise.all([
    getRecruiting(),
    getSeasonSetting(),
    db().select({ n: count() }).from(members).where(eq(members.status, "active")),
  ]);
  const { pill, label, detail } = recruitingStatus(new Date(), recruiting);
  const count_ = season.memberCount;
  const interviews = recruiting.interviewWindow ? [fmtDay(recruiting.interviewWindow.start), fmtDay(recruiting.interviewWindow.end)].filter(Boolean).join(" – ") : undefined;
  const dates: Array<[string, string | undefined]> = [
    ["Cycle", recruiting.cycleLabel],
    ["Deadline", fmtWhen(recruiting.applyDeadline)],
    ["Next opens", fmtWhen(recruiting.nextApplicationOpenDate)],
    ["Interviews", interviews || undefined],
    ["Decisions", fmtDay(recruiting.decisionDate)],
  ];
  return (
    <>
      <PageHeader title="Recruiting" description="Open or close applications, set the cycle's dates and the member count on Home." />
      <div className="flex flex-col gap-6">
        <Card aria-label="Status right now">
          <CardHeader title="Status right now" description="Changes show within a few seconds; scheduled openings and deadlines take effect within 5 minutes on their own." />
          <CardSection>
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status={pill}>{label}</StatusPill>
              {detail ? <p className="text-ui-section font-semibold text-ui-text">{detail}</p> : null}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
              {dates.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-ui-hint text-ui-text-3">{k}</dt>
                  <dd className="mt-0.5 text-ui-base text-ui-text tabular-nums">{v ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </CardSection>
          <CardSection title="Where it shows">
            <ul className="flex flex-wrap gap-2">
              {PLACES.map((p) => (
                <li key={p.label}>
                  <a href={p.href} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-ui-md border border-ui-border px-2.5 text-ui-label text-ui-text-2 transition-colors duration-150 hover:border-ui-border-strong hover:text-ui-accent">
                    {p.label}
                    <ArrowUpRight aria-hidden className="size-3.5" />
                    <span className="sr-only">: View on site (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </CardSection>
        </Card>
        <RecruitingForm recruiting={recruiting} action={saveRecruiting} />
        <MemberCountForm mode={count_?.mode ?? "manual"} value={count_?.mode === "manual" ? count_.value : undefined} activeCount={active[0]?.n ?? 0} action={saveMemberCount} />
      </div>
    </>
  );
}
