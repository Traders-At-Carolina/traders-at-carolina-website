import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClasses } from "@/components/Button";

/** Heading, intro and "Add" button shared by the list screens. */
export function ListHeader({ title, intro, addHref, addLabel }: { title: string; intro: ReactNode; addHref?: string; addLabel?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-h1">{title}</h1>
        <p className="mt-4 max-w-prose text-body text-ink-2">{intro}</p>
      </div>
      {addHref ? (
        <Link href={addHref} className={buttonClasses({})}>
          {addLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <p>
      <Link href={href} className="link-underline text-caption text-navy">
        {label}
      </Link>
    </p>
  );
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
