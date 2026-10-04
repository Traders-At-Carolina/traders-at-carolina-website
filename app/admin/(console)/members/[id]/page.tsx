import { notFound } from "next/navigation";
import { MemberForm } from "@/components/admin/MemberForm";
import { UUID } from "@/components/admin/ListPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { getMember, memberSnapshot } from "@/lib/admin/members-db";
import { requirePage } from "@/lib/auth/admin";
import { removeMemberAction, updateMemberAction } from "../actions";

export const metadata = { title: "Edit member" };

export default async function EditMemberPage({ params }: PageProps<"/admin/members/[id]">) {
  await requirePage();
  const { id } = await params;
  const row = UUID.test(id) ? await getMember(id) : undefined;
  if (!row) notFound();
  return (
    <>
      <PageHeader title={row.name} crumb={row.name} description={row.email} />
      <MemberForm member={memberSnapshot(row)} action={updateMemberAction.bind(null, row.id)} remove={removeMemberAction.bind(null, row.id)} />
    </>
  );
}
