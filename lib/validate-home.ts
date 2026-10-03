import type { HomeContent } from "@/content/types";
import { assertNoProblems } from "@/lib/validation";

/** Every content/home.ts problem (spec 01 §6); empty when valid. Admin saves show these as form errors (spec 06 §5). */
export function collectHomeProblems(home: HomeContent): string[] {
  const problems: string[] = [];

  if (home.pillars.length !== 3) {
    problems.push(`pillars must have exactly 3 entries (got ${home.pillars.length})`);
  }

  const { headline, headlineEmphasis } = home.hero;
  if (headlineEmphasis !== undefined && !headline.includes(headlineEmphasis)) {
    problems.push(`hero.headlineEmphasis "${headlineEmphasis}" must appear in hero.headline`);
  }

  const count = home.photos.length;
  if (count === 1 || count > 3) {
    problems.push(`photos must have 0 or 2–3 entries (got ${count})`);
  }
  home.photos.forEach((photo, i) => {
    if (!photo.alt.trim()) problems.push(`photos[${i}].alt must not be empty`);
    if (!photo.caption.trim()) problems.push(`photos[${i}].caption must not be empty`);
  });

  // Event dates are checked with the events themselves (lib/validate-events.ts, spec 09 §5.2).
  return problems;
}

/** Fails the build with every content/home.ts problem listed at once (spec 01 §6). */
export function validateHome(home: HomeContent): void {
  assertNoProblems("content/home.ts", collectHomeProblems(home));
}
