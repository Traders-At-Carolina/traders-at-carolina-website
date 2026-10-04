import { notFound } from "next/navigation";
import { UUID } from "@/components/admin/ListPage";
import { DeleteButton } from "@/components/admin/ListForms";
import { DuplicateButtons, EventForm } from "@/components/admin/SeasonForms";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { getEvent } from "@/lib/admin/settings-db";
import { requirePage } from "@/lib/auth/admin";
import { deleteEventAction, duplicateEvent, updateEventAction } from "../actions";

export const metadata = { title: "Edit event" };

export default async function EditEventPage({ params }: PageProps<"/admin/events/[id]">) {
  await requirePage();
  const { id } = await params;
  const row = UUID.test(id) ? await getEvent(id) : undefined;
  if (!row) notFound();
  return (
    <>
      <PageHeader title={row.title} crumb={row.title} actions={<DuplicateButtons id={row.id} action={duplicateEvent} />} />
      <div className="max-w-3xl">
        <EventForm event={row} action={updateEventAction.bind(null, row.id)} />
        <DeleteButton action={deleteEventAction.bind(null, row.id)} confirm={`Delete “${row.title}”? You can undo this right after.`} label="Delete event" />
      </div>
    </>
  );
}
