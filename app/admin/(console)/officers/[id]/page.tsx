import { notFound } from "next/navigation";
import { DeleteButton, OfficerForm } from "@/components/admin/ListForms";
import { UUID } from "@/components/admin/ListPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
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
  // The Team page renders each visible exec, co-president and director as a PersonCard with id={slug}.
  const onTeam = row.visible && row.group !== "track-lead";
  return (
    <>
      <PageHeader
        title={row.name}
        crumb={row.name}
        description={
          <>
            Link: <span className="font-medium text-ui-text">/team#{row.slug}</span> (fixed, so shared links keep working)
          </>
        }
        siteHref={onTeam ? `/team#${row.slug}` : undefined}
      />
      <OfficerForm officer={row} companies={companies} action={updateOfficerAction.bind(null, row.id)} />
      <DeleteButton action={deleteOfficerAction.bind(null, row.id)} confirm={`Remove ${row.name}?${leads} You can undo this right after.`} label="Remove officer" />
    </>
  );
}
