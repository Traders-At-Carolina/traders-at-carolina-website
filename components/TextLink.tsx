import Link from "next/link";
import type { ReactNode } from "react";

type TextLinkProps = {
  href: string;
  children: ReactNode;
  external?: boolean;
  /** Trailing → (internal) or ↗ (external). */
  arrow?: boolean;
  tone?: "default" | "inverse";
  className?: string;
};

/** Navy text link with a hairline underline that fills on hover (00 §10). */
export function TextLink({ href, children, external, arrow, tone = "default", className = "" }: TextLinkProps) {
  const classes = `link-underline ${tone === "inverse" ? "text-bone" : "text-navy"} ${className}`;
  const glyph = arrow ? (
    <>
      {" "}
      <span aria-hidden="true">{external ? "↗" : "→"}</span>
    </>
  ) : null;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
        {glyph}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
      {glyph}
    </Link>
  );
}
