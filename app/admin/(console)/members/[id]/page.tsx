import Link from "next/link";
import { notFound } from "next/navigation";
import { MemberForm } from "@/components/admin/MemberForm";
import { getMember, memberSnapshot } from "@/lib/admin/members-db";
import { requirePage } from "@/lib/auth/admin";
import { removeMemberAction, updateMemberAction } from "../actions";

export const metadata = { title: "Edit member" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditMemberPage({ params }: PageProps<"/admin/members/[id]">) {
  await requirePage();
  const { id } = await params;
  const row = UUID.test(id) ? await getMember(id) : undefined;
  if (!row) notFound();
  return (
    <>
      <p>
        <Link href="/admin/members" className="link-underline text-caption text-navy">
          Members
        </Link>
      </p>
      <h1 className="mt-2 text-h1">{row.name}</h1>
      <div className="mt-8">
        <MemberForm member={memberSnapshot(row)} action={updateMemberAction.bind(null, row.id)} remove={removeMemberAction.bind(null, row.id)} />
      </div>
    </>
  );
}
