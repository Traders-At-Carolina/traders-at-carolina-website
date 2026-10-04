import { notFound } from "next/navigation";
import { UUID } from "@/components/admin/ListPage";
import { ResourceForm } from "@/components/admin/PortalForms";
import { DeleteButton } from "@/components/admin/ui/Form";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { getResource } from "@/lib/admin/portal-db";
import { privateBlobToken, resourceFileName } from "@/lib/admin/upload-policy";
import { requirePage } from "@/lib/auth/admin";
import { deleteResourceAction, updateResourceAction } from "../actions";

export const metadata = { title: "Edit resource" };

export default async function EditResourcePage({ params }: PageProps<"/admin/resources/[id]">) {
  await requirePage();
  const { id } = await params;
  const row = UUID.test(id) ? await getResource(id) : undefined;
  if (!row) notFound();
  return (
    <>
      <PageHeader title={row.title} crumb={row.title} siteHref={row.file ? `/portal/files/${row.id}` : "/portal"} />
      <div className="max-w-3xl">
        <ResourceForm
          resource={{
            title: row.title,
            kind: row.kind,
            section: row.section,
            tracks: row.tracks,
            description: row.description,
            url: row.url,
            file: row.file,
            audience: row.audience,
            pinned: row.pinned,
            hidden: row.hidden,
          }}
          fileName={row.file ? resourceFileName(row.file.pathname) : undefined}
          action={updateResourceAction.bind(null, row.id)}
          uploadsEnabled={Boolean(privateBlobToken())}
        />
        <DeleteButton action={deleteResourceAction.bind(null, row.id)} confirm={`Delete “${row.title}”? It disappears from the portal. You can undo this right after.`} label="Delete resource" />
      </div>
    </>
  );
}
