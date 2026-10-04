import { AnnouncementForm } from "@/components/admin/PortalForms";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requirePage } from "@/lib/auth/admin";
import { createAnnouncement } from "../actions";

export const metadata = { title: "New announcement" };

export default async function NewAnnouncementPage() {
  await requirePage();
  return (
    <>
      <PageHeader title="New announcement" crumb="New announcement" description="Shown at the top of the portal between its dates." />
      <AnnouncementForm action={createAnnouncement} />
    </>
  );
}
