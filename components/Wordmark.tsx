import Image from "next/image";
import Link from "next/link";

const MARKS = {
  default: "/brand/logo.svg",
  inverse: "/brand/logo-bone.svg",
} as const;

// The mark's natural size (public/brand/*.svg); the rendered height comes from `size`.
const MARK_WIDTH = 305;
const MARK_HEIGHT = 322;

// `md` is the header, a touch smaller on phones so the mark, name, Apply and menu button all fit.
const SIZES = {
  md: { mark: "h-7 md:h-8", text: "text-[1.0625rem] md:text-[1.25rem]" },
  lg: { mark: "h-11", text: "text-[1.25rem]" },
} as const;

type WordmarkProps = {
  /** `inverse` swaps in the one-colour bone logo for black and navy backgrounds (00 §8.1). */
  tone?: "default" | "inverse";
  size?: keyof typeof SIZES;
};

/**
 * The club's logo mark beside the typeset name (00 §8.1). The mark is decorative, because the link's
 * accessible name already says the club name. On very narrow phones the name is dropped so the mark,
 * Apply and the menu button still fit.
 */
export function Wordmark({ tone = "default", size = "md" }: WordmarkProps) {
  return (
    <Link
      href="/"
      aria-label="Traders at Carolina, home"
      className={`hit-target inline-flex items-center gap-2.5 font-display ${SIZES[size].text} leading-none whitespace-nowrap ${tone === "inverse" ? "text-bone" : "text-black"}`}
    >
      <Image
        src={MARKS[tone]}
        alt=""
        width={MARK_WIDTH}
        height={MARK_HEIGHT}
        unoptimized
        priority
        className={`${SIZES[size].mark} w-auto shrink-0`}
      />
      <span className="max-[359px]:hidden">
        Traders <em>at</em> Carolina
      </span>
    </Link>
  );
}
