import { SponsorForm } from "@/components/admin/ListForms";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requirePage } from "@/lib/auth/admin";
import { createSponsor } from "../actions";

export const metadata = { title: "Add sponsor" };

export default async function NewSponsorPage() {
  await requirePage();
  return (
    <>
      <PageHeader title="Add sponsor" crumb="Add sponsor" description="It appears on About and in Home's “Sponsored by”." />
      <SponsorForm action={createSponsor} />
    </>
  );
}
