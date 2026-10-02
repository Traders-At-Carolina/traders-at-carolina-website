import Image from "next/image";
import { MARK_HEIGHT, MARK_WIDTH } from "@/components/Wordmark";

/**
 * Home intro (spec 01 §3.6): graph paper draws in, the logo and name rise, then the overlay dissolves
 * into the hero's own grid. Hidden unless the head script (lib/intro.ts) has put `intro` on <html>,
 * so in-site navigation, no-JS and reduced motion never see it. Decorative throughout.
 */
export function IntroOverlay() {
  return (
    <div aria-hidden="true" className="intro-overlay fixed inset-0 z-[60] place-items-center bg-bone">
      <div className="intro-rows absolute inset-0" />
      <div className="intro-cols absolute inset-0" />
      <div className="relative flex flex-col items-center gap-6 px-6">
        <Image
          src="/brand/logo.svg"
          alt=""
          width={MARK_WIDTH}
          height={MARK_HEIGHT}
          unoptimized
          className="intro-mark h-20 w-auto md:h-28"
        />
        <p className="intro-name font-display text-h3 leading-none whitespace-nowrap md:text-h2">
          Traders <em>at</em> Carolina
        </p>
      </div>
    </div>
  );
}
