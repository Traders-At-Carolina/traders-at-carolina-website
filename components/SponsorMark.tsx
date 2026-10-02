import type { CSSProperties } from "react";
import type { Partner } from "@/content/types";

/**
 * A sponsor's mark, drawn as a mask over the current text color so every logo reads in one tone
 * instead of competing brand colors. Decorative: the firm name beside it is the accessible label.
 */
export function SponsorMark({ logo, height = 24 }: { logo: NonNullable<Partner["logo"]>; height?: number }) {
  const mask = `url("${logo.src}") center / contain no-repeat`;
  const style: CSSProperties = {
    width: Math.round((height * logo.width) / logo.height),
    height,
    mask,
    WebkitMask: mask,
  };
  return <span aria-hidden="true" className="inline-block shrink-0 bg-current opacity-80" style={style} />;
}
