import { notFound } from "next/navigation";
import { DeleteButton, PlacementForm } from "@/components/admin/ListForms";
import { UUID } from "@/components/admin/ListPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { getPlacement } from "@/lib/admin/lists-db";
import { requirePage } from "@/lib/auth/admin";
import { deletePlacementAction, updatePlacementAction } from "../actions";

export const metadata = { title: "Edit firm" };

export default async function EditPlacementPage({ params }: PageProps<"/admin/placements/[id]">) {
  await requirePage();
  const { id } = await params;
  const row = UUID.test(id) ? await getPlacement(id) : undefined;
  if (!row) notFound();
  return (
    <>
      <PageHeader title={row.firm} crumb={row.firm} />
      <div className="max-w-2xl">
        <PlacementForm placement={row} action={updatePlacementAction.bind(null, row.id)} />
        <DeleteButton
          action={deletePlacementAction.bind(null, row.id)}
          confirm={`Remove ${row.firm}? It leaves the wall and the firm list, and officers who had its badge lose it. You can undo this right after.`}
          label="Remove firm"
        />
      </div>
    </>
  );
}
