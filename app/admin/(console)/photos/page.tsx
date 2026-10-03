import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/Button";
import { SaveToast } from "@/components/admin/SaveToast";
import { SlotsForm } from "@/components/admin/SlotsForm";
import { getEntry } from "@/lib/admin/audit";
import { getSlots, listPhotos } from "@/lib/admin/photos-db";
import { requirePage } from "@/lib/auth/admin";
import { saveSlots } from "./actions";

export const metadata = { title: "Photos" };

/** Photo library and the Home / Membership slots (spec 06 §6.6). */
export default async function PhotosPage({ searchParams }: PageProps<"/admin/photos">) {
  await requirePage();
  const { saved } = await searchParams;
  const [library, home, membership] = await Promise.all([listPhotos(), getSlots("home"), getSlots("membership")]);
  // A create or delete redirects here with ?saved=<audit id>, so the toast can offer Undo.
  const savedEntry = typeof saved === "string" && /^\d+$/.test(saved) ? await getEntry(Number(saved)) : undefined;
  const options = library.map((p) => ({ id: p.id, caption: p.caption }));
  const homeCount = home.filter(Boolean).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">Photos</h1>
          <p className="mt-4 max-w-prose text-body text-ink-2">The library holds every club photo. Put up to three on Home and three on Membership.</p>
        </div>
        <Link href="/admin/photos/new" className={buttonClasses({})}>
          Add photo
        </Link>
      </div>

      <div className="mt-10 flex flex-col gap-10">
        <SlotsForm
          page="home"
          title="Home photos"
          hint={
            homeCount < 2
              ? "Inside the club needs 2 photos, so it is hidden right now. Slot 1 runs large; slots 2 and 3 stack beside it."
              : "Inside the club, on the Home page. Slot 1 runs large; slots 2 and 3 stack beside it."
          }
          slotLabels={["Slot 1 · large", "Slot 2", "Slot 3"]}
          options={options}
          slots={home}
          action={saveSlots}
        />
        <SlotsForm
          page="membership"
          title="Membership photos"
          hint="Slot 1 runs wide under “How it works”. Slots 2 and 3 pair up after Activities, and show only when both are filled."
          slotLabels={["Slot 1 · wide", "Slot 2 · pair", "Slot 3 · pair"]}
          options={options}
          slots={membership}
          action={saveSlots}
        />
      </div>

      <section aria-labelledby="library-title" className="mt-12 border-t border-rule pt-6">
        <h2 id="library-title" className="text-h3">
          Library ({library.length})
        </h2>
        {library.length === 0 ? (
          <p className="mt-4 text-ink-3">No photos yet.</p>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3">
            {library.map((p) => {
              const where = [p.homeOrder ? `Home ${p.homeOrder}` : null, p.membershipOrder ? `Membership ${p.membershipOrder}` : null].filter(Boolean);
              return (
                <li key={p.id}>
                  <Link href={`/admin/photos/${p.id}`} className="group block">
                    <div className={`relative overflow-hidden bg-wash ${p.ratio === "4:5" ? "aspect-[4/5]" : "aspect-[3/2]"}`}>
                      <Image
                        src={p.image}
                        alt={p.alt}
                        fill
                        sizes="(min-width: 768px) 240px, 45vw"
                        placeholder={p.image.blurDataURL ? "blur" : "empty"}
                        className="object-cover transition-opacity group-hover:opacity-90"
                      />
                    </div>
                    <p className="mt-2 text-body text-black group-hover:underline">{p.caption}</p>
                    <p className="text-caption text-ink-3">{where.length ? where.join(" · ") : "Not on a page"}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {savedEntry ? (
        <SaveToast
          state={{
            ok: savedEntry.action === "delete" ? "Photo deleted." : "Added to the library. Put it on a page above.",
            undoId: savedEntry.id,
            at: savedEntry.id,
          }}
        />
      ) : null}
    </>
  );
}
