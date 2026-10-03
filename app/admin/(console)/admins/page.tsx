import { InviteAdminForm } from "@/components/admin/InviteAdminForm";
import { RowActionForm } from "@/components/admin/RowActionForm";
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
      <h1 className="text-h1">Admins</h1>
      <p className="mt-4 max-w-prose text-body text-ink-2">
        Admins can edit the site and see its analytics. Someone who already has an account gets access straight away; anyone else gets an
        email invitation.
      </p>

      <section className="mt-10" aria-labelledby="invite-title">
        <h2 id="invite-title" className="text-h3">
          Add an admin
        </h2>
        <div className="mt-4 max-w-xl">
          <InviteAdminForm action={inviteAdmin} />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="admins-title">
        <h2 id="admins-title" className="text-h3">
          Current admins ({admins.length})
        </h2>
        <ul className="mt-4 divide-y divide-rule border-y border-rule">
          {admins.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-body text-black">
                  {a.name}
                  {a.id === userId ? <span className="text-ink-3"> (you)</span> : null}
                </p>
                {a.email && a.email !== a.name ? <p className="text-caption text-ink-3">{a.email}</p> : null}
              </div>
              {a.id === userId || admins.length <= 1 ? null : (
                <RowActionForm
                  action={removeAdmin}
                  fields={{ userId: a.id }}
                  label="Remove"
                  ariaLabel={`Remove ${a.name} as admin`}
                  confirm={`Remove ${a.name} as an admin? Their account stays; they just lose access to /admin.`}
                />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="invites-title">
        <h2 id="invites-title" className="text-h3">
          Pending invitations ({invites.length})
        </h2>
        {invites.length === 0 ? (
          <p className="mt-4 text-ink-3">None.</p>
        ) : (
          <ul className="mt-4 divide-y divide-rule border-y border-rule">
            {invites.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-body text-black">{i.email}</p>
                  <p className="text-caption text-ink-3">Sent {sent.format(i.createdAt)}</p>
                </div>
                <RowActionForm
                  action={revokeInvite}
                  fields={{ invitationId: i.id, email: i.email }}
                  label="Revoke"
                  ariaLabel={`Revoke the invitation to ${i.email}`}
                  confirm={`Revoke the invitation to ${i.email}?`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
