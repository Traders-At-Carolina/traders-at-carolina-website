import { notFound } from "next/navigation";
import { BackLink, UUID } from "@/components/admin/ListPage";
import { DeleteButton, SponsorForm } from "@/components/admin/ListForms";
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
      <BackLink href="/admin/sponsors" label="Sponsors" />
      <h1 className="mt-2 text-h1">{row.name}</h1>
      <div className="mt-8">
        <SponsorForm sponsor={row} action={updateSponsorAction.bind(null, row.id)} />
        <DeleteButton action={deleteSponsorAction.bind(null, row.id)} confirm={`Remove ${row.name} from About and Home? You can undo this right after.`} label="Remove sponsor" />
      </div>
    </>
  );
}
