import Link from "next/link";
import { parseInline } from "@/lib/inline-markdown";

/** Inline markdown as React: text, *emphasis* and [links](/path), external links opening in a new tab (05 §5). */
export function InlineMarkdown({ source }: { source: string }) {
  return (
    <>
      {parseInline(source).map((token, i) => {
        if (token.type === "text") return token.value;
        if (token.type === "em") return <em key={i}>{token.value}</em>;
        const external = token.href.startsWith("https://");
        return external ? (
          <a key={i} href={token.href} target="_blank" rel="noopener noreferrer" className="link-underline text-navy">
            {token.text}
          </a>
        ) : (
          <Link key={i} href={token.href} className="link-underline text-navy">
            {token.text}
          </Link>
        );
      })}
    </>
  );
}
