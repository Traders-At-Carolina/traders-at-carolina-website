import { Megaphone, Pin, Plus } from "lucide-react";
import Link from "next/link";
import { ListHeader } from "@/components/admin/ListPage";
import { SavedFromParam } from "@/components/admin/SavedFromParam";
import { Badge, StatusPill } from "@/components/admin/ui/Badge";
import { ButtonLink } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/Feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { AUDIENCE_LABELS } from "@/lib/admin/portal-labels";
import { listAnnouncements } from "@/lib/admin/portal-db";
import { announcementStatus } from "@/lib/admin/portal-schemas";
import { requirePage } from "@/lib/auth/admin";
import { formatEventDateTime } from "@/lib/format";

export const metadata = { title: "Announcements" };

const when = (d: Date | null) => (d ? formatEventDateTime(d) : "—");

/** Announcements with their Live, Scheduled or Expired state (spec 06 §6.12, spec 11 §6). */
export default async function AnnouncementsPage({ searchParams }: PageProps<"/admin/announcements">) {
  await requirePage();
  const [{ saved }, rows] = await Promise.all([searchParams, listAnnouncements()]);
  const now = new Date();
  return (
    <>
      <ListHeader
        title="Announcements"
        intro="Short notes at the top of the portal. Only live ones show; scheduled and expired ones wait here."
        addHref="/admin/announcements/new"
        addLabel="New announcement"
      />
      <Card>
        {rows.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No announcements"
            description="The portal shows nothing above its first section until you post one."
            action={
              <ButtonLink href="/admin/announcements/new" variant="primary" icon={Plus}>
                New announcement
              </ButtonLink>
            }
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Title</TH>
                <TH>Status</TH>
                <TH>Audience</TH>
                <TH>Show from</TH>
                <TH>Show until</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((a) => (
                <TR key={a.id} className="relative">
                  <TD>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/announcements/${a.id}`} className="font-medium text-ui-text after:absolute after:inset-0 hover:text-ui-accent">
                        {a.title}
                      </Link>
                      {a.pinned ? (
                        <Badge tone="accent">
                          <Pin aria-hidden className="size-3" />
                          Pinned
                        </Badge>
                      ) : null}
                    </div>
                  </TD>
                  <TD>
                    <StatusPill status={announcementStatus(a, now)} />
                  </TD>
                  <TD>
                    <Badge tone={a.audience === "members" ? "accent" : "neutral"}>{AUDIENCE_LABELS[a.audience]}</Badge>
                  </TD>
                  <TD className="whitespace-nowrap text-ui-text-2 tabular-nums">{when(a.showFrom)}</TD>
                  <TD className="whitespace-nowrap text-ui-text-2 tabular-nums">{when(a.showUntil)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
      <SavedFromParam saved={saved} viewHref="/portal" />
    </>
  );
}
