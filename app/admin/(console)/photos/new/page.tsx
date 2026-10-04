import { PhotoForm } from "@/components/admin/PhotoForm";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requirePage } from "@/lib/auth/admin";
import { createPhoto } from "../actions";

export const metadata = { title: "Add photo" };

export default async function NewPhotoPage() {
  await requirePage();
  return (
    <>
      <PageHeader title="Add photo" crumb="Add photo" description="It goes into the library. Put it on Home or Membership from the Photos screen." />
      <PhotoForm action={createPhoto} />
    </>
  );
}
