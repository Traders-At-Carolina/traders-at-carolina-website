import { notFound } from "next/navigation";
import { UUID } from "@/components/admin/ListPage";
import { AnnouncementForm } from "@/components/admin/PortalForms";
import { DeleteButton } from "@/components/admin/ui/Form";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { getAnnouncement } from "@/lib/admin/portal-db";
import { requirePage } from "@/lib/auth/admin";
import { toEasternLocal } from "@/lib/eastern-time";
import { deleteAnnouncementAction, updateAnnouncementAction } from "../actions";

export const metadata = { title: "Edit announcement" };

export default async function EditAnnouncementPage({ params }: PageProps<"/admin/announcements/[id]">) {
  await requirePage();
  const { id } = await params;
  const row = UUID.test(id) ? await getAnnouncement(id) : undefined;
  if (!row) notFound();
  return (
    <>
      <PageHeader title={row.title} crumb={row.title} />
      <div className="max-w-3xl">
        <AnnouncementForm
          announcement={{
            title: row.title,
            body: row.body,
            audience: row.audience,
            pinned: row.pinned,
            showFrom: row.showFrom ? toEasternLocal(row.showFrom) : "",
            showUntil: row.showUntil ? toEasternLocal(row.showUntil) : "",
          }}
          action={updateAnnouncementAction.bind(null, row.id)}
        />
        <DeleteButton action={deleteAnnouncementAction.bind(null, row.id)} confirm={`Delete “${row.title}”? It disappears from the portal. You can undo this right after.`} label="Delete announcement" />
      </div>
    </>
  );
}
