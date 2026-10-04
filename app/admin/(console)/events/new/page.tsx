import { EventForm } from "@/components/admin/SeasonForms";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requirePage } from "@/lib/auth/admin";
import { createEvent } from "../actions";

export const metadata = { title: "Add event" };

export default async function NewEventPage() {
  await requirePage();
  return (
    <>
      <PageHeader title="Add event" crumb="Add event" description="Website events show on the site and the portal; portal events only after sign-in." />
      <EventForm action={createEvent} />
    </>
  );
}
