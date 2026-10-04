import { IdCard, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AcademicYearForm, MoveButtons } from "@/components/admin/ListForms";
import { ListHeader } from "@/components/admin/ListPage";
import { SavedFromParam } from "@/components/admin/SavedFromParam";
import { StatusPill } from "@/components/admin/ui/Badge";
import { ButtonLink } from "@/components/admin/ui/Button";
import { Card, CardHeader, CardSection } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/Feedback";
import { getSeasonSetting, listPeople } from "@/lib/admin/lists-db";
import { requirePage } from "@/lib/auth/admin";
import { initials } from "@/lib/team";
import { moveOfficer, saveAcademicYear } from "./actions";

export const metadata = { title: "Officers" };

const TIERS = [
  ["exec", "Executive board"],
  ["co-president", "Co-Presidents"],
  ["director", "Directors"],
  ["track-lead", "Track leads"],
] as const;

export default async function OfficersPage({ searchParams }: PageProps<"/admin/officers">) {
  await requirePage();
  const [{ saved }, rows, season] = await Promise.all([searchParams, listPeople(), getSeasonSetting()]);
  return (
    <>
      <ListHeader title="Officers" intro="The leadership roster on the Team page. Hidden officers stay here for next year's handover." addHref="/admin/officers/new" addLabel="Add officer" />
      <div className="flex flex-col gap-6">
        <Card>
          <CardSection>
            <AcademicYearForm value={season.academicYear} action={saveAcademicYear} />
          </CardSection>
        </Card>
        {rows.length === 0 ? (
          <Card>
            <EmptyState
              icon={IdCard}
              title="No officers yet"
              description="Officers appear on the Team page once you add them."
              action={
                <ButtonLink href="/admin/officers/new" variant="primary" icon={Plus}>
                  Add officer
                </ButtonLink>
              }
            />
          </Card>
        ) : null}
        {TIERS.map(([group, label]) => {
          const tier = rows.filter((p) => p.group === group).sort((a, b) => a.sortOrder - b.sortOrder);
          if (tier.length === 0) return null;
          return (
            <Card key={group} aria-labelledby={`tier-${group}`}>
              <CardHeader id={`tier-${group}`} title={label} description={group === "track-lead" ? "Linked from Membership, not shown on Team." : undefined} />
              <ul className="divide-y divide-ui-border">
                {tier.map((p, i) => (
                  <li key={p.id} className="relative flex items-center gap-3 px-5 py-2.5 transition-colors duration-150 hover:bg-ui-subtle">
                    {p.headshot ? (
                      <Image src={p.headshot} alt="" width={36} height={36} className="size-9 shrink-0 rounded-ui-full object-cover" />
                    ) : (
                      <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-ui-full bg-ui-accent-soft text-ui-label font-semibold text-ui-accent">
                        {initials(p.name)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/officers/${p.id}`} className="block truncate text-ui-base font-medium text-ui-text after:absolute after:inset-0 hover:text-ui-accent">
                        {p.name}
                      </Link>
                      <p className="truncate text-ui-label text-ui-text-2">{p.role}</p>
                    </div>
                    {p.visible ? null : <StatusPill status="hidden" />}
                    <div className="relative z-10">
                      <MoveButtons action={moveOfficer} fields={{ id: p.id, group }} name={p.name} first={i === 0} last={i === tier.length - 1} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
      <SavedFromParam saved={saved} viewHref="/team" />
    </>
  );
}
