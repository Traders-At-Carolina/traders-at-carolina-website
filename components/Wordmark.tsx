import Image from "next/image";
import Link from "next/link";

const MARKS = {
  default: "/brand/logo.svg",
  inverse: "/brand/logo-bone.svg",
} as const;

// The mark's natural size (public/brand/*.svg); the rendered height comes from `size`.
export const MARK_WIDTH = 305;
export const MARK_HEIGHT = 322;

// `md` is the header, a touch smaller on phones so the mark, name, Apply and menu button all fit.
const SIZES = {
  md: { mark: "h-7 md:h-8", text: "text-[1.0625rem] md:text-[1.25rem]" },
  lg: { mark: "h-11", text: "text-[1.25rem]" },
} as const;

type WordmarkProps = {
  /** `inverse` swaps in the one-colour bone logo for black and navy backgrounds (00 §8.1). */
  tone?: "default" | "inverse";
  size?: keyof typeof SIZES;
  /** The header's name slides in behind the mark as the page scrolls (`--logo-tuck`, 00 §10). */
  tuck?: boolean;
};

/**
 * The club's logo mark beside the typeset name (00 §8.1). The mark is decorative, because the link's
 * accessible name already says the club name. On very narrow phones the name is dropped so the mark,
 * Apply and the menu button still fit. With `tuck`, the name sits in a track clipped at the mark's edge
 * and slides out of sight behind it as the page scrolls; hovering or focusing the logo brings it back.
 */
export function Wordmark({ tone = "default", size = "md", tuck = false }: WordmarkProps) {
  const name = (
    <>
      Traders <em>at</em> Carolina
    </>
  );
  return (
    <Link
      href="/"
      aria-label="Traders at Carolina, home"
      className={`hit-target group inline-flex items-center ${tuck ? "" : "gap-2.5"} font-display ${SIZES[size].text} leading-none whitespace-nowrap ${tone === "inverse" ? "text-bone" : "text-black"}`}
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
      {tuck ? (
        <span data-wordmark-track className="wordmark-track pl-2.5 max-[359px]:hidden">
          <span className="wordmark-name block">{name}</span>
        </span>
      ) : (
        <span className="max-[359px]:hidden">{name}</span>
      )}
    </Link>
  );
}
