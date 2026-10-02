import Link from "next/link";
import type { ReactNode } from "react";
import { type Track, trackAttrs } from "@/lib/analytics/attributes";

type TextLinkProps = {
  href: string;
  children: ReactNode;
  external?: boolean;
  /** Trailing → (internal) or ↗ (external). */
  arrow?: boolean;
  tone?: "default" | "inverse";
  className?: string;
  /** Names the click in analytics (spec 06 §7.1). */
  track?: Track;
};

/** Navy text link with a hairline underline that fills on hover (00 §10). */
export function TextLink({ href, children, external, arrow, tone = "default", className = "", track }: TextLinkProps) {
  const tracking = trackAttrs(track);
  const classes = `link-underline ${tone === "inverse" ? "text-bone" : "text-navy"} ${className}`;
  const glyph = arrow ? (
    <>
      {" "}
      <span aria-hidden="true">{external ? "↗" : "→"}</span>
    </>
  ) : null;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...tracking}>
        {children}
        {glyph}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...tracking}>
      {children}
      {glyph}
    </Link>
  );
}
