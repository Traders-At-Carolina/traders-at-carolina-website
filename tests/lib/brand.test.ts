import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (name: string) => readFileSync(`public/brand/${name}`, "utf8");

const variants = [
  { file: "logo.svg", colour: "#233265" },
  { file: "logo-black.svg", colour: "#000000" },
  { file: "logo-bone.svg", colour: "#EBEAE4" },
];

/** Geometry with the colour removed, so the variants can be compared. */
const shape = (svg: string, colour: string) => svg.split(colour).join("COLOUR");

describe("brand logo files (00 §8.1)", () => {
  it.each(variants)("$file is a single-colour SVG in $colour", ({ file, colour }) => {
    const svg = read(file);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain("<title>Traders at Carolina</title>");
    const colours = new Set(svg.match(/#[0-9A-Fa-f]{6}\b/g));
    expect(colours).toEqual(new Set([colour]));
  });

  it("the three variants share identical geometry", () => {
    const [full, black, bone] = variants.map(({ file, colour }) => shape(read(file), colour));
    expect(black).toBe(full);
    expect(bone).toBe(full);
  });
});
