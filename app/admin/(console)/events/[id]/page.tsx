import { notFound } from "next/navigation";
import { BackLink, UUID } from "@/components/admin/ListPage";
import { DeleteButton } from "@/components/admin/ListForms";
import { DuplicateButtons, EventForm } from "@/components/admin/SeasonForms";
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
      <BackLink href="/admin/events" label="Events" />
      <h1 className="mt-2 text-h1">{row.title}</h1>
      <div className="mt-4">
        <DuplicateButtons id={row.id} action={duplicateEvent} />
      </div>
      <div className="mt-6">
        <EventForm event={row} action={updateEventAction.bind(null, row.id)} />
        <DeleteButton action={deleteEventAction.bind(null, row.id)} confirm={`Delete “${row.title}”? You can undo this right after.`} label="Delete event" />
      </div>
    </>
  );
}
