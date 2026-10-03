import { TrackForm } from "@/components/admin/ListForms";
import { listPeople, listTracks } from "@/lib/admin/lists-db";
import { requirePage } from "@/lib/auth/admin";
import { updateTrackAction } from "./actions";

export const metadata = { title: "Tracks" };

const ORDER = ["trading", "research", "development"] as const;

/** The three fixed tracks (spec 06 §6.9), in Trading, Research, Development order. */
export default async function TracksPage() {
  await requirePage();
  const [rows, people] = await Promise.all([listTracks(), listPeople()]);
  const leads = people.filter((p) => p.visible).map((p) => ({ slug: p.slug, name: p.name }));
  return (
    <>
      <h1 className="text-h1">Tracks</h1>
      <p className="mt-4 max-w-prose text-body text-ink-2">
        The three tracks on the Membership page. Leads are picked from officers shown on the Team page. Background is recommended, never required.
      </p>
      <div className="mt-8 flex flex-col gap-10">
        {ORDER.map((id) => {
          const t = rows.find((r) => r.id === id);
          return t ? <TrackForm key={id} track={t} leads={leads} action={updateTrackAction.bind(null, id)} /> : null;
        })}
      </div>
    </>
  );
}
