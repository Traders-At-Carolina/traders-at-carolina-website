import Link from "next/link";

/**
 * Typeset stand-in for the club logo until the SVG files are supplied (00 §8.1, §14).
 * Swap the inner markup for the logo; keep the link and accessible name.
 */
export function Wordmark({ tone = "default" }: { tone?: "default" | "inverse" }) {
  return (
    <Link
      href="/"
      aria-label="Traders at Carolina, home"
      className={`font-display text-[1.25rem] leading-none whitespace-nowrap ${tone === "inverse" ? "text-bone" : "text-black"}`}
    >
      Traders <em>at</em> Carolina
    </Link>
  );
}
