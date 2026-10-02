import Image from "next/image";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import type { CompanyMark } from "@/content/types";

type PlacementWallProps = {
  companies: CompanyMark[];
};

/** Team header art: the firms leadership has worked at, as ink marks with their names in a hairline grid (spec 04 §4.1). */
export function PlacementWall({ companies }: PlacementWallProps) {
  return (
    <Reveal>
      <Eyebrow>{"Where we've worked"}</Eyebrow>
      <ul className="mt-6 grid grid-cols-3 border-y border-rule">
        {companies.map((company) => (
          <li
            key={company.name}
            className="flex h-28 flex-col items-center justify-center gap-3 px-3 lg:h-32 [&:not(:nth-child(3n+1))]:border-l [&:nth-child(n+4)]:border-t border-rule"
          >
            {/* Marks are transparent PNGs; brightness-0 flattens them to one ink colour on bone. The caption names
                the firm because some marks (Infragrid's bare square) say nothing alone, so the image is decorative. */}
            <Image src={company.logo} alt="" className="h-8 w-auto max-w-full object-contain opacity-70 brightness-0" />
            <span className="text-caption text-ink-2">{company.name}</span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
