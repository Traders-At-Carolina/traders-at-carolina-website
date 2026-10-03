import { count, eq } from "drizzle-orm";
import { MemberCountForm, RecruitingForm } from "@/components/admin/SeasonForms";
import { getApplicationState } from "@/lib/applications";
import { getSeasonSetting } from "@/lib/admin/lists-db";
import { requirePage } from "@/lib/auth/admin";
import { getRecruiting } from "@/lib/data/public";
import { db } from "@/lib/db/client";
import { members } from "@/lib/db/schema";
import { saveMemberCount, saveRecruiting } from "./actions";

export const metadata = { title: "Recruiting" };

const when = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });

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
  const state = getApplicationState(new Date(), recruiting);
  const status =
    state.status === "open"
      ? state.deadline
        ? `Open · closes ${when.format(state.deadline)} ET`
        : "Open · no deadline set"
      : state.nextOpen
        ? `Closed · ${recruiting.mode === "scheduled" ? "opens automatically" : "next opens"} ${when.format(state.nextOpen)} ET`
        : "Closed";
  const count_ = season.memberCount;
  return (
    <>
      <h1 className="text-h1">Recruiting</h1>
      <section aria-label="Status right now" className="mt-8 border border-rule bg-white p-4">
        <p className="text-h3">{status}</p>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-caption">
          {PLACES.map((p) => (
            <li key={p.label}>
              {p.label}:{" "}
              <a href={p.href} target="_blank" rel="noopener noreferrer" className="link-underline text-navy">
                View on site
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-caption text-ink-3">Changes show within a few seconds; scheduled openings and deadlines take effect within 5 minutes on their own.</p>
      </section>
      <div className="mt-10">
        <RecruitingForm recruiting={recruiting} action={saveRecruiting} />
      </div>
      <section aria-labelledby="season-title" className="mt-12 border-t border-rule pt-6">
        <h2 id="season-title" className="text-h3">
          Season
        </h2>
        <div className="mt-4">
          <MemberCountForm mode={count_?.mode ?? "manual"} value={count_?.mode === "manual" ? count_.value : undefined} activeCount={active[0]?.n ?? 0} action={saveMemberCount} />
        </div>
      </section>
    </>
  );
}
