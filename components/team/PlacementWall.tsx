import Image from "next/image";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import type { CompanyMark } from "@/content/types";

type PlacementWallProps = {
  companies: CompanyMark[];
};

function Cells({ companies }: PlacementWallProps) {
  return companies.map((company) => (
    <li key={company.name} className="flex h-28 w-48 shrink-0 flex-col items-center justify-center gap-3 px-4 lg:h-32">
      {/* Marks are flattened to one ink colour on bone. The caption names the firm because some marks
          (Infragrid's bare square) say nothing alone, so the image is decorative. */}
      <Image src={company.logo} alt="" className="h-auto max-h-8 w-auto max-w-full object-contain opacity-70 brightness-0" />
      <span className="text-caption text-ink-2">{company.name}</span>
    </li>
  ));
}

/**
 * Team header art: the firms leadership has worked at, as a slow looping strip that fades out at both edges (spec 04 §4.1).
 * The list is repeated once so the loop is seamless; the copy is aria-hidden. Motion lives in globals.css (.logo-strip)
 * and is off for reduced motion, where the strip is a static wrapped grid.
 */
export function PlacementWall({ companies }: PlacementWallProps) {
  return (
    <Reveal>
      <Eyebrow>{"Where we've worked"}</Eyebrow>
      <div className="logo-strip mt-6 border-y border-rule">
        <div className="logo-strip-track">
          <ul className="logo-strip-list">
            <Cells companies={companies} />
          </ul>
          <ul aria-hidden="true" className="logo-strip-list logo-strip-copy">
            <Cells companies={companies} />
          </ul>
        </div>
      </div>
    </Reveal>
  );
}
