import { BookOpen, FolderOpen, Link2, ListChecks, type LucideIcon, NotebookPen, Plus, Presentation, Video } from "lucide-react";
import Link from "next/link";
import { ListHeader } from "@/components/admin/ListPage";
import { SavedFromParam } from "@/components/admin/SavedFromParam";
import { Badge, StatusPill } from "@/components/admin/ui/Badge";
import { ButtonLink } from "@/components/admin/ui/Button";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { Banner, EmptyState } from "@/components/admin/ui/Feedback";
import { MoveButtons } from "@/components/admin/ui/Form";
import { listResources, type ResourceRow } from "@/lib/admin/portal-db";
import { AUDIENCE_LABELS, KIND_LABELS, SECTION_LABELS, TRACK_LABELS } from "@/lib/admin/portal-labels";
import { RESOURCE_SECTIONS } from "@/lib/admin/portal-schemas";
import { privateBlobToken } from "@/lib/admin/upload-policy";
import { requirePage } from "@/lib/auth/admin";
import { moveResource } from "./actions";

export const metadata = { title: "Resources" };

const KIND_ICONS: Record<ResourceRow["kind"], LucideIcon> = { slides: Presentation, notes: NotebookPen, textbook: BookOpen, "problem-set": ListChecks, video: Video, link: Link2 };
const SECTION_HINTS: Record<ResourceRow["section"], string> = {
  learning: "Members' Learning columns: slides, notes, then textbooks and the rest.",
  "interview-prep": "Practice material under Interview prep.",
  recruiting: "Links under the recruiting timeline, for people who aren't members yet.",
  other: "Shown in Learning's last column, after textbooks.",
};

/** Resources grouped by section, pinned first, then by order (spec 06 §6.11, spec 11 §6). */
export default async function ResourcesPage({ searchParams }: PageProps<"/admin/resources">) {
  await requirePage();
  const [{ saved }, rows] = await Promise.all([searchParams, listResources()]);
  const uploadsEnabled = Boolean(privateBlobToken());
  return (
    <>
      <ListHeader title="Resources" intro="Slides, notes, textbooks and links in the portal. Uploaded files open only for people allowed to see them." addHref="/admin/resources/new" addLabel="Add resource" />
      {!uploadsEnabled ? (
        <Banner tone="info" className="mb-6">
          File uploads need the private file store, which isn&apos;t set up yet. Links work now.
        </Banner>
      ) : null}
      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={FolderOpen}
            title="No resources yet"
            description="Each portal column says “Nothing posted yet.” until you add something."
            action={
              <ButtonLink href="/admin/resources/new" variant="primary" icon={Plus}>
                Add resource
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {RESOURCE_SECTIONS.map((section) => {
            const items = rows.filter((r) => r.section === section);
            const titleId = `section-${section}`;
            return (
              <Card key={section} aria-labelledby={titleId}>
                <CardHeader
                  id={titleId}
                  title={
                    <span className="flex items-center gap-2">
                      {SECTION_LABELS[section]} <Badge className="tabular-nums">{items.length}</Badge>
                    </span>
                  }
                  description={SECTION_HINTS[section]}
                />
                {items.length ? (
                  <ul className="divide-y divide-ui-border">
                    {items.map((r) => {
                      const group = items.filter((x) => x.pinned === r.pinned);
                      const at = group.indexOf(r);
                      const Icon = KIND_ICONS[r.kind];
                      return (
                        <li key={r.id} className="relative flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 transition-colors duration-150 hover:bg-ui-subtle">
                          <span className="flex w-28 shrink-0 items-center gap-2 text-ui-label text-ui-text-2">
                            <Icon aria-hidden className="size-4 text-ui-text-3" />
                            {KIND_LABELS[r.kind]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <Link href={`/admin/resources/${r.id}`} className="block truncate text-ui-base font-medium text-ui-text after:absolute after:inset-0 hover:text-ui-accent">
                              {r.title}
                            </Link>
                            <p className="mt-0.5 text-ui-hint text-ui-text-3">
                              {r.tracks.length ? r.tracks.map((t) => TRACK_LABELS[t]).join(", ") : "All tracks"} · {r.file ? "Uploaded file" : "Link"}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge tone={r.audience === "members" ? "accent" : "neutral"}>{AUDIENCE_LABELS[r.audience]}</Badge>
                            {r.pinned ? <StatusPill status="pinned" /> : null}
                            {r.hidden ? <StatusPill status="hidden" /> : null}
                          </div>
                          <div className="relative z-10">
                            <MoveButtons action={moveResource} fields={{ id: r.id }} name={r.title} first={at === 0} last={at === group.length - 1} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="px-5 py-4 text-ui-label text-ui-text-3">Nothing here yet.</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <SavedFromParam saved={saved} viewHref="/portal" />
    </>
  );
}
