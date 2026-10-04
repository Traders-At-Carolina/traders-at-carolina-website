import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/admin/ui/Button";
import { PageHeader } from "@/components/admin/ui/PageHeader";

/** Heading, intro and "Add" button shared by the list screens (spec 11 §4 PageHeader). */
export function ListHeader({ title, intro, addHref, addLabel, siteHref }: { title: string; intro: ReactNode; addHref?: string; addLabel?: string; siteHref?: string | false }) {
  return (
    <PageHeader
      title={title}
      description={intro}
      siteHref={siteHref}
      actions={
        addHref ? (
          <ButtonLink href={addHref} variant="primary" icon={Plus}>
            {addLabel}
          </ButtonLink>
        ) : null
      }
    />
  );
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
