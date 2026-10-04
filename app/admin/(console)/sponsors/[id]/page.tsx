import { notFound } from "next/navigation";
import { DeleteButton, SponsorForm } from "@/components/admin/ListForms";
import { UUID } from "@/components/admin/ListPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { getSponsor } from "@/lib/admin/lists-db";
import { requirePage } from "@/lib/auth/admin";
import { deleteSponsorAction, updateSponsorAction } from "../actions";

export const metadata = { title: "Edit sponsor" };

export default async function EditSponsorPage({ params }: PageProps<"/admin/sponsors/[id]">) {
  await requirePage();
  const { id } = await params;
  const row = UUID.test(id) ? await getSponsor(id) : undefined;
  if (!row) notFound();
  return (
    <>
      <PageHeader title={row.name} crumb={row.name} />
      <SponsorForm sponsor={row} action={updateSponsorAction.bind(null, row.id)} />
      <DeleteButton action={deleteSponsorAction.bind(null, row.id)} confirm={`Remove ${row.name} from About and Home? You can undo this right after.`} label="Remove sponsor" />
    </>
  );
}
