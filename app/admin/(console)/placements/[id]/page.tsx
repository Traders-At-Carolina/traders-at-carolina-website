import { notFound } from "next/navigation";
import { BackLink, UUID } from "@/components/admin/ListPage";
import { DeleteButton, PlacementForm } from "@/components/admin/ListForms";
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
      <BackLink href="/admin/placements" label="Placements" />
      <h1 className="mt-2 text-h1">{row.firm}</h1>
      <div className="mt-8">
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
