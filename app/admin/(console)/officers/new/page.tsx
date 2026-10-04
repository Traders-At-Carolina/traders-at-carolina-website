import { OfficerForm } from "@/components/admin/ListForms";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { listPlacements } from "@/lib/admin/lists-db";
import { requirePage } from "@/lib/auth/admin";
import { createOfficer } from "../actions";

export const metadata = { title: "Add officer" };

export default async function NewOfficerPage() {
  await requirePage();
  const companies = (await listPlacements()).map((p) => ({ id: p.id, firm: p.firm, logo: p.logoOnDark ?? p.logo }));
  return (
    <>
      <PageHeader title="Add officer" crumb="Add officer" description="They appear on the Team page under their tier." />
      <OfficerForm companies={companies} action={createOfficer} />
    </>
  );
}
