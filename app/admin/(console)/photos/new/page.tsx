import Link from "next/link";
import { PhotoForm } from "@/components/admin/PhotoForm";
import { requirePage } from "@/lib/auth/admin";
import { createPhoto } from "../actions";

export const metadata = { title: "Add photo" };

export default async function NewPhotoPage() {
  await requirePage();
  return (
    <>
      <p>
        <Link href="/admin/photos" className="link-underline text-caption text-navy">
          Photos
        </Link>
      </p>
      <h1 className="mt-2 text-h1">Add photo</h1>
      <div className="mt-8">
        <PhotoForm action={createPhoto} />
      </div>
    </>
  );
}
