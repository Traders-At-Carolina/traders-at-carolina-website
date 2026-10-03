import { BackLink } from "@/components/admin/ListPage";
import { EventForm } from "@/components/admin/SeasonForms";
import { requirePage } from "@/lib/auth/admin";
import { createEvent } from "../actions";

export const metadata = { title: "Add event" };

export default async function NewEventPage() {
  await requirePage();
  return (
    <>
      <BackLink href="/admin/events" label="Events" />
      <h1 className="mt-2 text-h1">Add event</h1>
      <div className="mt-8">
        <EventForm action={createEvent} />
      </div>
    </>
  );
}
