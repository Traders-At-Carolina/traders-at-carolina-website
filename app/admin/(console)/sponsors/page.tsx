import { Handshake, Plus } from "lucide-react";
import Link from "next/link";
import { ListHeader } from "@/components/admin/ListPage";
import { SavedFromParam } from "@/components/admin/SavedFromParam";
import { ButtonLink } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/Feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { SponsorMark } from "@/components/SponsorMark";
import { listSponsors } from "@/lib/admin/lists-db";
import { requirePage } from "@/lib/auth/admin";

export const metadata = { title: "Sponsors" };

export default async function SponsorsPage({ searchParams }: PageProps<"/admin/sponsors">) {
  await requirePage();
  const [{ saved }, rows] = await Promise.all([searchParams, listSponsors()]);
  return (
    <>
      <ListHeader title="Sponsors" intro="Firms that support the club, on About and in Home's “Sponsored by”. Only list firms that have agreed to it." addHref="/admin/sponsors/new" addLabel="Add sponsor" />
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={Handshake} title="No sponsors yet" description="Sponsors appear on About once you add one." action={<ButtonLink href="/admin/sponsors/new" variant="primary" icon={Plus}>Add sponsor</ButtonLink>} />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH className="w-40">Logo</TH>
                <TH>Name</TH>
                <TH>Relationship</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((s) => (
                <TR key={s.id} className="relative">
                  <TD>
                    {s.logo ? (
                      <span className="text-ui-text-2">
                        <SponsorMark logo={s.logo} height={20} />
                      </span>
                    ) : (
                      <span className="text-ui-hint text-ui-text-3">No logo</span>
                    )}
                  </TD>
                  <TD>
                    <Link href={`/admin/sponsors/${s.id}`} className="font-medium text-ui-text after:absolute after:inset-0 hover:text-ui-accent">
                      {s.name}
                    </Link>
                  </TD>
                  <TD className="text-ui-text-2">{s.relationship ?? "—"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
      <SavedFromParam saved={saved} viewHref="/about" />
    </>
  );
}
