import Image from "next/image";
import Link from "next/link";
import { ListHeader } from "@/components/admin/ListPage";
import { AcademicYearForm, MoveButtons } from "@/components/admin/ListForms";
import { SavedFromParam } from "@/components/admin/SavedFromParam";
import { getSeasonSetting, listPeople } from "@/lib/admin/lists-db";
import { requirePage } from "@/lib/auth/admin";
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
      <div className="mt-8">
        <AcademicYearForm value={season.academicYear} action={saveAcademicYear} />
      </div>
      {TIERS.map(([group, label]) => {
        const tier = rows.filter((p) => p.group === group).sort((a, b) => a.sortOrder - b.sortOrder);
        if (tier.length === 0) return null;
        return (
          <section key={group} aria-labelledby={`tier-${group}`} className="mt-10">
            <h2 id={`tier-${group}`} className="text-h3">
              {label}
            </h2>
            <ul className="mt-4 divide-y divide-rule border-y border-rule">
              {tier.map((p, i) => (
                <li key={p.id} className="flex items-center justify-between gap-4 py-2">
                  <Link href={`/admin/officers/${p.id}`} className="flex min-h-11 items-center gap-3 hover:underline">
                    {p.headshot ? <Image src={p.headshot} alt="" width={40} height={40} className="size-10 rounded-sm object-cover" /> : <span className="size-10 rounded-sm bg-wash" />}
                    <span>
                      <span className="block text-body text-black">{p.name}</span>
                      <span className="block text-caption text-ink-3">
                        {p.role}
                        {p.visible ? "" : " · hidden"}
                      </span>
                    </span>
                  </Link>
                  <MoveButtons action={moveOfficer} fields={{ id: p.id, group }} name={p.name} first={i === 0} last={i === tier.length - 1} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <SavedFromParam saved={saved} viewHref="/team" />
    </>
  );
}
