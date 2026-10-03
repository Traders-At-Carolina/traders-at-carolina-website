import { notFound } from "next/navigation";
import { BackLink, UUID } from "@/components/admin/ListPage";
import { DeleteButton, OfficerForm } from "@/components/admin/ListForms";
import { getPerson, listPlacements, tracksLedBy } from "@/lib/admin/lists-db";
import { requirePage } from "@/lib/auth/admin";
import { deleteOfficerAction, updateOfficerAction } from "../actions";

export const metadata = { title: "Edit officer" };

export default async function EditOfficerPage({ params }: PageProps<"/admin/officers/[id]">) {
  await requirePage();
  const { id } = await params;
  const row = UUID.test(id) ? await getPerson(id) : undefined;
  if (!row) notFound();
  const [placements, led] = await Promise.all([listPlacements(), tracksLedBy(row.slug)]);
  const companies = placements.map((p) => ({ id: p.id, firm: p.firm, logo: p.logoOnDark ?? p.logo }));
  const leads = led.length ? ` They lead ${led.map((t) => t.name).join(" and ")}, which will have no lead.` : "";
  return (
    <>
      <BackLink href="/admin/officers" label="Officers" />
      <h1 className="mt-2 text-h1">{row.name}</h1>
      <p className="mt-2 text-caption text-ink-3">Link: /team#{row.slug} (fixed, so shared links keep working)</p>
      <div className="mt-8">
        <OfficerForm officer={row} companies={companies} action={updateOfficerAction.bind(null, row.id)} />
        <DeleteButton action={deleteOfficerAction.bind(null, row.id)} confirm={`Remove ${row.name}?${leads} You can undo this right after.`} label="Remove officer" />
      </div>
    </>
  );
}
