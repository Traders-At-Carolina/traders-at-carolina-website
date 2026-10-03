import { BackLink } from "@/components/admin/ListPage";
import { SponsorForm } from "@/components/admin/ListForms";
import { requirePage } from "@/lib/auth/admin";
import { createSponsor } from "../actions";

export const metadata = { title: "Add sponsor" };

export default async function NewSponsorPage() {
  await requirePage();
  return (
    <>
      <BackLink href="/admin/sponsors" label="Sponsors" />
      <h1 className="mt-2 text-h1">Add sponsor</h1>
      <div className="mt-8">
        <SponsorForm action={createSponsor} />
      </div>
    </>
  );
}
