import { AddMembersForm } from "@/components/admin/AddMembersForm";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requirePage } from "@/lib/auth/admin";
import { addMembers, previewMembers } from "../actions";

export const metadata = { title: "Add members" };

export default async function AddMembersPage() {
  await requirePage();
  return (
    <>
      <PageHeader
        title="Add members"
        crumb="Add"
        description="After each recruiting cycle, paste the new members' emails. Anyone who signs up with one of them is a member from their first portal visit."
      />
      <div className="max-w-4xl">
        <AddMembersForm preview={previewMembers} add={addMembers} />
      </div>
    </>
  );
}
