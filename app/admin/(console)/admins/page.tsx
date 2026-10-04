import { MailOpen } from "lucide-react";
import { InviteAdminForm } from "@/components/admin/InviteAdminForm";
import { RowActionForm } from "@/components/admin/RowActionForm";
import { Badge } from "@/components/admin/ui/Badge";
import { Card, CardHeader, CardSection } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/Feedback";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { listAdmins, listPendingAdminInvites } from "@/lib/admin/clerk-admins";
import { requirePage } from "@/lib/auth/admin";
import { inviteAdmin, removeAdmin, revokeInvite } from "./actions";

export const metadata = { title: "Admins" };

const sent = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/New_York" });

/** Admins screen (spec 06 §6.7): who can edit the site, pending invitations, and inviting next year's board. */
export default async function AdminsPage() {
  const { userId } = await requirePage();
  const [admins, invites] = await Promise.all([listAdmins(), listPendingAdminInvites()]);

  return (
    <>
      <PageHeader
        title="Admins"
        description="Admins can edit the site and see its analytics. Someone who already has an account gets access straight away; anyone else gets an email invitation."
      />

      <div className="flex flex-col gap-6">
        <Card aria-labelledby="invite-title">
          <CardHeader id="invite-title" title="Add an admin" />
          <CardSection>
            <div className="max-w-xl">
              <InviteAdminForm action={inviteAdmin} />
            </div>
          </CardSection>
        </Card>

        <Card aria-labelledby="admins-title">
          <CardHeader id="admins-title" title={<>Current admins <span className="font-normal text-ui-text-3 tabular-nums">({admins.length})</span></>} />
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH className="text-right">
                  <span className="sr-only">Actions</span>
                </TH>
              </TR>
            </THead>
            <TBody>
              {admins.map((a) => (
                <TR key={a.id}>
                  <TD className="font-medium">
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      {a.name}
                      {a.id === userId ? <Badge>You</Badge> : null}
                    </span>
                  </TD>
                  <TD className="text-ui-text-2">{a.email && a.email !== a.name ? a.email : "—"}</TD>
                  <TD className="text-right">
                    {a.id === userId || admins.length <= 1 ? null : (
                      <RowActionForm
                        action={removeAdmin}
                        fields={{ userId: a.id }}
                        label="Remove"
                        ariaLabel={`Remove ${a.name} as admin`}
                        confirm={`Remove ${a.name} as an admin? Their account stays; they just lose access to /admin.`}
                      />
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card aria-labelledby="invites-title">
          <CardHeader id="invites-title" title={<>Pending invitations <span className="font-normal text-ui-text-3 tabular-nums">({invites.length})</span></>} />
          {invites.length === 0 ? (
            <EmptyState icon={MailOpen} title="No pending invitations" description="Invitations sent to people without an account wait here until they sign up." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Email</TH>
                  <TH>Sent</TH>
                  <TH className="text-right">
                    <span className="sr-only">Actions</span>
                  </TH>
                </TR>
              </THead>
              <TBody>
                {invites.map((i) => (
                  <TR key={i.id}>
                    <TD className="font-medium">{i.email}</TD>
                    <TD className="whitespace-nowrap text-ui-text-2 tabular-nums">{sent.format(i.createdAt)}</TD>
                    <TD className="text-right">
                      <RowActionForm
                        action={revokeInvite}
                        fields={{ invitationId: i.id, email: i.email }}
                        label="Revoke"
                        ariaLabel={`Revoke the invitation to ${i.email}`}
                        confirm={`Revoke the invitation to ${i.email}?`}
                      />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
