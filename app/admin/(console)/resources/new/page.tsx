import { ResourceForm } from "@/components/admin/PortalForms";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { privateBlobToken } from "@/lib/admin/upload-policy";
import { requirePage } from "@/lib/auth/admin";
import { createResource } from "../actions";

export const metadata = { title: "Add resource" };

export default async function NewResourcePage() {
  await requirePage();
  return (
    <>
      <PageHeader title="Add resource" crumb="Add resource" description="Upload a file or paste a link, then choose where it shows and who can see it." />
      <ResourceForm action={createResource} uploadsEnabled={Boolean(privateBlobToken())} />
    </>
  );
}
