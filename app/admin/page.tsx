import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { requirePage } from "@/lib/auth/admin";

export const metadata = { title: "Admin" };

/** Placeholder until the editors land (spec 06 §9, phases 2–5). */
export default async function AdminHome() {
  await requirePage();
  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-h1">Admin</h1>
        <UserButton />
      </div>
      <p className="mt-6 text-lead text-ink-2">You&apos;re signed in. Editors for photos, officers, tracks, sponsors and placements arrive next.</p>
      <p className="mt-8">
        <Link href="/" className="link-underline text-navy">
          Back to the site
        </Link>
      </p>
    </main>
  );
}
