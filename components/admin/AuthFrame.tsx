import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdminMark } from "./AdminTopBar";

/** Sign-in and sign-up: the Clerk card centred on bone over graph paper, under the club mark (spec 11 §2.4). */
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="relative isolate flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <div aria-hidden className="graph-paper pointer-events-none absolute inset-0 -z-10" />
      <AdminMark />
      {children}
      <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 text-ui-label font-medium text-ui-text-2 hover:text-ui-text">
        <ArrowLeft aria-hidden className="size-4" />
        Back to the site
      </Link>
    </main>
  );
}
