import { BackLink } from "@/components/admin/ListPage";
import { OfficerForm } from "@/components/admin/ListForms";
import { listPlacements } from "@/lib/admin/lists-db";
import { requirePage } from "@/lib/auth/admin";
import { createOfficer } from "../actions";

export const metadata = { title: "Add officer" };

export default async function NewOfficerPage() {
  await requirePage();
  const companies = (await listPlacements()).map((p) => ({ id: p.id, firm: p.firm, logo: p.logoOnDark ?? p.logo }));
  return (
    <>
      <BackLink href="/admin/officers" label="Officers" />
      <h1 className="mt-2 text-h1">Add officer</h1>
      <div className="mt-8">
        <OfficerForm companies={companies} action={createOfficer} />
      </div>
    </>
  );
}
