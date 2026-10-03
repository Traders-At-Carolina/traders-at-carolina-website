import Link from "next/link";
import { ListHeader } from "@/components/admin/ListPage";
import { SavedFromParam } from "@/components/admin/SavedFromParam";
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
      {rows.length === 0 ? (
        <p className="mt-8 text-ink-3">No sponsors yet.</p>
      ) : (
        <ul className="mt-8 divide-y divide-rule border-y border-rule">
          {rows.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4 py-3">
              <Link href={`/admin/sponsors/${s.id}`} className="flex min-h-11 items-center gap-4 hover:underline">
                {s.logo ? <span className="text-ink-2"><SponsorMark logo={s.logo} height={20} /></span> : null}
                <span className="text-body text-black">{s.name}</span>
              </Link>
              <span className="text-caption text-ink-3">{s.relationship ?? ""}</span>
            </li>
          ))}
        </ul>
      )}
      <SavedFromParam saved={saved} viewHref="/about" />
    </>
  );
}
