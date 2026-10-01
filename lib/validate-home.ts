import type { HomeContent } from "@/content/types";
import { parseEasternDateTime } from "@/lib/eastern-time";

/** Fails the build with every content/home.ts problem listed at once (spec 01 §6). */
export function validateHome(home: HomeContent): void {
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

  if (home.upcoming) {
    try {
      parseEasternDateTime(home.upcoming.date);
    } catch (error) {
      problems.push(`upcoming.date: ${(error as Error).message}`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`Invalid content/home.ts:\n- ${problems.join("\n- ")}`);
  }
}
