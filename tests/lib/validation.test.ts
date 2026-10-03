import { describe, expect, it } from "vitest";
import { assertNoProblems } from "@/lib/validation";

describe("assertNoProblems", () => {
  it("does nothing when there are no problems", () => {
    expect(() => assertNoProblems("content/home.ts", [])).not.toThrow();
  });

  it("throws one error listing every problem under the label", () => {
    expect(() => assertNoProblems("content/home.ts", ["a is wrong", "b is wrong"])).toThrow(
      "Invalid content/home.ts:\n- a is wrong\n- b is wrong",
    );
  });
});
