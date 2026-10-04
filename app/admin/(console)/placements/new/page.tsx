import { PlacementForm } from "@/components/admin/ListForms";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requirePage } from "@/lib/auth/admin";
import { createPlacement } from "../actions";

export const metadata = { title: "Add firm" };

export default async function NewPlacementPage() {
  await requirePage();
  return (
    <>
      <PageHeader title="Add firm" crumb="Add firm" description="It feeds the Team firm list, the placement wall and officers' badges." />
      <PlacementForm action={createPlacement} />
    </>
  );
}
