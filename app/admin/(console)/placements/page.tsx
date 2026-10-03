import Image from "next/image";
import Link from "next/link";
import { ListHeader } from "@/components/admin/ListPage";
import { MoveButtons } from "@/components/admin/ListForms";
import { SavedFromParam } from "@/components/admin/SavedFromParam";
import { listPlacements } from "@/lib/admin/lists-db";
import { requirePage } from "@/lib/auth/admin";
import { PLACEMENT_THRESHOLD } from "@/lib/team";
import { moveOnWall } from "./actions";

export const metadata = { title: "Placements" };

export default async function PlacementsPage({ searchParams }: PageProps<"/admin/placements">) {
  await requirePage();
  const [{ saved }, rows] = await Promise.all([searchParams, listPlacements()]);
  const wall = rows.filter((r) => r.showOnWall);
  const rest = rows.filter((r) => !r.showOnWall);
  return (
    <>
      <ListHeader
        title="Placements"
        intro={
          <>
            Firms where members have worked. They feed the Team firm list, the placement wall on Team and in the footer, and officers&apos; badges.{" "}
            {rows.length < PLACEMENT_THRESHOLD ? `The Team firm list appears at ${PLACEMENT_THRESHOLD} firms (${rows.length} now).` : null}
          </>
        }
        addHref="/admin/placements/new"
        addLabel="Add firm"
      />
      <section aria-labelledby="wall-title" className="mt-10">
        <h2 id="wall-title" className="text-h3">
          On the placement wall ({wall.length})
        </h2>
        <ul className="mt-4 divide-y divide-rule border-y border-rule">
          {wall.map((p, i) => (
            <li key={p.id} className="flex items-center justify-between gap-4 py-2">
              <Link href={`/admin/placements/${p.id}`} className="flex min-h-11 items-center gap-4 hover:underline">
                {p.logo ? <Image src={p.logo} alt="" width={72} height={Math.round((72 * p.logo.height) / p.logo.width)} className="h-6 w-auto" /> : null}
                <span className="text-body text-black">{p.firm}</span>
              </Link>
              <MoveButtons action={moveOnWall} fields={{ id: p.id }} name={p.firm} first={i === 0} last={i === wall.length - 1} />
            </li>
          ))}
        </ul>
      </section>
      {rest.length ? (
        <section aria-labelledby="rest-title" className="mt-10">
          <h2 id="rest-title" className="text-h3">
            Listed only ({rest.length})
          </h2>
          <ul className="mt-4 divide-y divide-rule border-y border-rule">
            {rest.map((p) => (
              <li key={p.id} className="py-2">
                <Link href={`/admin/placements/${p.id}`} className="flex min-h-11 items-center text-body text-black hover:underline">
                  {p.firm}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <SavedFromParam saved={saved} viewHref="/team" />
    </>
  );
}
