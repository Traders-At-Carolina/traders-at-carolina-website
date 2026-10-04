import { Link2 } from "lucide-react";
import { PortalLinkDelete, PortalLinkDialog, PortalSettingsForm } from "@/components/admin/PortalForms";
import { Badge } from "@/components/admin/ui/Badge";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { Banner, EmptyState } from "@/components/admin/ui/Feedback";
import { MoveButtons } from "@/components/admin/ui/Form";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { AUDIENCE_LABELS } from "@/lib/admin/portal-labels";
import { listPortalLinks } from "@/lib/admin/portal-db";
import { requirePage } from "@/lib/auth/admin";
import { readPortalSetting } from "@/lib/members/settings";
import { createPortalLink, deletePortalLinkAction, movePortalLink, savePortalSettings, updatePortalLinkAction } from "./actions";

export const metadata = { title: "Portal settings" };

/** Member links, welcome lines and access (spec 06 §6.13, spec 11 §6). */
export default async function PortalSettingsPage() {
  await requirePage();
  const [links, settings] = await Promise.all([listPortalLinks(), readPortalSetting()]);
  const trackerFromEnv = links.length === 0 && Boolean(process.env.INTERNSHIP_TRACKER_URL?.trim());
  return (
    <>
      <PageHeader title="Portal settings" description="What members and visitors see in the portal besides events, resources and announcements." />
      <div className="flex max-w-3xl flex-col gap-6">
        <Card aria-labelledby="links-title">
          <CardHeader
            id="links-title"
            title={
              <span className="flex items-center gap-2">
                Member links <Badge className="tabular-nums">{links.length}</Badge>
              </span>
            }
            description="Cards under Member tools, in this order: the internship tracker, Slack or GroupMe, the Drive folder, the calendar."
            actions={<PortalLinkDialog action={createPortalLink} trigger="add" />}
          />
          {trackerFromEnv ? (
            <div className="px-5 pt-4">
              <Banner tone="info">Until you add a link here, members see the internship tracker from the INTERNSHIP_TRACKER_URL setting. Adding any link replaces it.</Banner>
            </div>
          ) : null}
          {links.length ? (
            <ul className="divide-y divide-ui-border">
              {links.map((l, i) => (
                <li key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ui-base font-medium text-ui-text">{l.label}</p>
                    <p className="truncate text-ui-hint text-ui-text-3">{l.description ?? l.url}</p>
                  </div>
                  <Badge tone={l.audience === "members" ? "accent" : "neutral"}>{AUDIENCE_LABELS[l.audience]}</Badge>
                  <div className="flex items-center gap-1">
                    <PortalLinkDialog
                      link={{ label: l.label, url: l.url, description: l.description, audience: l.audience }}
                      action={updatePortalLinkAction.bind(null, l.id)}
                      trigger="edit"
                    />
                    <MoveButtons action={movePortalLink} fields={{ id: l.id }} name={l.label} first={i === 0} last={i === links.length - 1} />
                    <PortalLinkDelete label={l.label} action={deletePortalLinkAction.bind(null, l.id)} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Link2} title="No member links yet" description="Members see “Link coming soon.” under Member tools until you add one." />
          )}
        </Card>
        <PortalSettingsForm
          settings={{ welcomeMember: settings.welcomeMember, welcomeVisitor: settings.welcomeVisitor, alumniAccess: settings.alumniAccess, acceptRequests: settings.acceptRequests }}
          action={savePortalSettings}
        />
      </div>
    </>
  );
}
