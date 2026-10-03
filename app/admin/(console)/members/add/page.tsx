import Link from "next/link";
import { AddMembersForm } from "@/components/admin/AddMembersForm";
import { requirePage } from "@/lib/auth/admin";
import { addMembers, previewMembers } from "../actions";

export const metadata = { title: "Add members" };

export default async function AddMembersPage() {
  await requirePage();
  return (
    <>
      <p>
        <Link href="/admin/members" className="link-underline text-caption text-navy">
          Members
        </Link>
      </p>
      <h1 className="mt-2 text-h1">Add members</h1>
      <p className="mt-4 max-w-prose text-body text-ink-2">
        After each recruiting cycle, paste the new members&apos; emails. Anyone who signs up with one of them is a member from their first portal visit.
      </p>
      <div className="mt-8 max-w-3xl">
        <AddMembersForm preview={previewMembers} add={addMembers} />
      </div>
    </>
  );
}
