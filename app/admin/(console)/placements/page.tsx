import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { MoveButtons } from "@/components/admin/ListForms";
import { ListHeader } from "@/components/admin/ListPage";
import { SavedFromParam } from "@/components/admin/SavedFromParam";
import { Badge } from "@/components/admin/ui/Badge";
import { ButtonLink } from "@/components/admin/ui/Button";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/Feedback";
import { SponsorMark } from "@/components/SponsorMark";
import type { ImageAsset } from "@/content/types";
import { listPlacements } from "@/lib/admin/lists-db";
import { requirePage } from "@/lib/auth/admin";
import { PLACEMENT_THRESHOLD } from "@/lib/team";
import { moveOnWall } from "./actions";

export const metadata = { title: "Placements" };

/** One firm row: logo cell and name linking to its editor (the whole row is clickable), plus optional trailing controls. */
function FirmRow({ id, firm, logo, children }: { id: string; firm: string; logo: ImageAsset | null; children?: ReactNode }) {
  return (
    <li className="relative flex items-center gap-4 px-6 py-2.5 transition-colors duration-150 hover:bg-ui-subtle">
      <span className="flex w-32 shrink-0 items-center text-ui-text-2">{logo ? <SponsorMark logo={logo} height={20} /> : <span className="text-ui-hint text-ui-text-3">No logo</span>}</span>
      <Link href={`/admin/placements/${id}`} className="min-w-0 flex-1 truncate text-ui-base font-medium text-ui-text after:absolute after:inset-0 hover:text-ui-accent">
        {firm}
      </Link>
      {children ? <div className="relative z-10">{children}</div> : null}
    </li>
  );
}

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
      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="No firms yet"
            description="Firms appear on the Team page and the placement wall once you add them."
            action={
              <ButtonLink href="/admin/placements/new" variant="primary" icon={Plus}>
                Add firm
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <Card aria-labelledby="wall-title">
            <CardHeader
              id="wall-title"
              title={
                <span className="flex items-center gap-2">
                  On the placement wall <Badge className="tabular-nums">{wall.length}</Badge>
                </span>
              }
              description="Shown in this order in the Team header and the footer."
            />
            {wall.length ? (
              <ul className="divide-y divide-ui-border">
                {wall.map((p, i) => (
                  <FirmRow key={p.id} id={p.id} firm={p.firm} logo={p.logo}>
                    <MoveButtons action={moveOnWall} fields={{ id: p.id }} name={p.firm} first={i === 0} last={i === wall.length - 1} />
                  </FirmRow>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Building2} title="No firms on the wall" description="Turn on “Show on the placement wall” in a firm to add it here." />
            )}
          </Card>
          {rest.length ? (
            <Card aria-labelledby="rest-title">
              <CardHeader
                id="rest-title"
                title={
                  <span className="flex items-center gap-2">
                    Listed only <Badge className="tabular-nums">{rest.length}</Badge>
                  </span>
                }
                description="In the Team firm list and officers' badges, but not on the wall."
              />
              <ul className="divide-y divide-ui-border">
                {rest.map((p) => (
                  <FirmRow key={p.id} id={p.id} firm={p.firm} logo={p.logo} />
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      )}
      <SavedFromParam saved={saved} viewHref="/team" />
    </>
  );
}
