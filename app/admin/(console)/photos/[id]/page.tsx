import { notFound } from "next/navigation";
import { PhotoForm } from "@/components/admin/PhotoForm";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { photoSnapshot } from "@/lib/admin/photos";
import { getPhoto } from "@/lib/admin/photos-db";
import { requirePage } from "@/lib/auth/admin";
import { deletePhotoAction, updatePhotoAction } from "../actions";

export const metadata = { title: "Edit photo" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditPhotoPage({ params }: PageProps<"/admin/photos/[id]">) {
  await requirePage();
  const { id } = await params;
  const row = UUID.test(id) ? await getPhoto(id) : undefined;
  if (!row) notFound();
  const placements = [row.homeOrder ? `Home slot ${row.homeOrder}` : null, row.membershipOrder ? `Membership slot ${row.membershipOrder}` : null].filter(
    (p): p is string => p !== null,
  );

  return (
    <>
      <PageHeader title="Edit photo" crumb={row.caption || "Edit photo"} />
      <PhotoForm photo={photoSnapshot(row)} action={updatePhotoAction.bind(null, row.id)} deleteAction={deletePhotoAction.bind(null, row.id)} placements={placements} />
    </>
  );
}
