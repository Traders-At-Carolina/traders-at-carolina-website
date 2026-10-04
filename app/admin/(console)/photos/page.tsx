import { Images, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SaveToast } from "@/components/admin/SaveToast";
import { SlotsForm } from "@/components/admin/SlotsForm";
import { Badge } from "@/components/admin/ui/Badge";
import { ButtonLink } from "@/components/admin/ui/Button";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/Feedback";
import { PageHeader } from "@/components/admin/ui/PageHeader";
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
  const options = library.map((p) => ({ id: p.id, caption: p.caption, image: p.image }));
  const homeCount = home.filter(Boolean).length;

  return (
    <>
      <PageHeader
        title="Photos"
        description="The library holds every club photo. Put up to three on Home and three on Membership."
        actions={
          <ButtonLink href="/admin/photos/new" variant="primary" icon={Upload}>
            Upload photo
          </ButtonLink>
        }
      />

      <div className="flex flex-col gap-6">
        <SlotsForm
          page="home"
          title="Home photos"
          hint="Inside the club, on the Home page. Slot 1 runs large; slots 2 and 3 stack beside it."
          notice={homeCount < 2 ? "Inside the club needs 2 photos, so it is hidden right now." : undefined}
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

        <Card aria-labelledby="library-title">
          <CardHeader
            id="library-title"
            title={
              <span className="flex items-center gap-2">
                Library
                <Badge className="tabular-nums">{library.length}</Badge>
              </span>
            }
            description="Select a photo to edit its caption, alt text or crop."
          />
          {library.length === 0 ? (
            <EmptyState
              icon={Images}
              title="No photos yet"
              description="Upload a photo, then put it on Home or Membership above."
              action={
                <ButtonLink href="/admin/photos/new" variant="primary" icon={Upload}>
                  Upload photo
                </ButtonLink>
              }
            />
          ) : (
            <ul className="grid grid-cols-2 gap-4 p-5 md:grid-cols-3 xl:grid-cols-4">
              {library.map((p) => {
                const where = [p.homeOrder ? `Home ${p.homeOrder}` : null, p.membershipOrder ? `Membership ${p.membershipOrder}` : null].filter((w): w is string => w !== null);
                return (
                  <li key={p.id}>
                    <Link href={`/admin/photos/${p.id}`} className="group flex h-full flex-col rounded-ui-lg border border-ui-border bg-ui-surface p-2 transition-colors duration-150 hover:border-ui-border-strong hover:bg-ui-canvas">
                      <div className={`relative overflow-hidden rounded-ui-md bg-ui-subtle ${p.ratio === "4:5" ? "aspect-[4/5]" : "aspect-[3/2]"}`}>
                        <Image
                          src={p.image}
                          alt={p.alt}
                          fill
                          sizes="(min-width: 1280px) 220px, (min-width: 768px) 30vw, 45vw"
                          placeholder={p.image.blurDataURL ? "blur" : "empty"}
                          className="object-cover transition-opacity group-hover:opacity-90"
                        />
                      </div>
                      <p className="mt-2 line-clamp-2 px-1 text-ui-base font-medium text-ui-text group-hover:text-ui-accent">{p.caption}</p>
                      <div className="mt-auto flex flex-wrap gap-1 px-1 pt-2 pb-1">
                        {where.length ? (
                          where.map((w) => (
                            <Badge key={w} tone="accent">
                              {w}
                            </Badge>
                          ))
                        ) : (
                          <Badge>Not on a page</Badge>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

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
