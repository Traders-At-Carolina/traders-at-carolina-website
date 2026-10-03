import { BackLink } from "@/components/admin/ListPage";
import { PlacementForm } from "@/components/admin/ListForms";
import { requirePage } from "@/lib/auth/admin";
import { createPlacement } from "../actions";

export const metadata = { title: "Add firm" };

export default async function NewPlacementPage() {
  await requirePage();
  return (
    <>
      <BackLink href="/admin/placements" label="Placements" />
      <h1 className="mt-2 text-h1">Add firm</h1>
      <div className="mt-8">
        <PlacementForm action={createPlacement} />
      </div>
    </>
  );
}
