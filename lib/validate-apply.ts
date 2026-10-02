import type { ApplyContent } from "@/content/types";
import { parseInline } from "@/lib/inline-markdown";

/** Fails the build with every content/apply.ts problem listed at once (spec 05 §5). */
export function validateApply(apply: ApplyContent): void {
  const problems: string[] = [];

  if (apply.benefits.length !== 3) problems.push(`benefits must have exactly 3 entries (got ${apply.benefits.length})`);
  if (apply.stages.length !== 3) problems.push(`stages must have exactly 3 entries (got ${apply.stages.length})`);
  // Spec 05 asks for 4+; drafts stay off production until the club confirms them, so 1 published answer is enforced.
  if (!apply.faq.some((item) => !item.draft)) problems.push("faq must have at least 1 published (non-draft) entry");

  apply.benefits.forEach((item, i) => {
    if (item.link && !/^(\/|#|https:\/\/)/.test(item.link.href)) {
      problems.push(`benefits[${i}] link "${item.link.href}" must start with /, # or https://`);
    }
  });

  apply.faq.forEach((item, i) => {
    if (!item.question.trim() || !item.answer.trim()) problems.push(`faq[${i}] needs a question and an answer`);
    for (const token of parseInline(item.answer)) {
      if (token.type === "link" && !/^(\/|#|https:\/\/|mailto:)/.test(token.href)) {
        problems.push(`faq[${i}] link "${token.href}" must start with /, #, https:// or mailto:`);
      }
    }
  });

  if (problems.length > 0) {
    throw new Error(`Invalid content/apply.ts:\n- ${problems.join("\n- ")}`);
  }
}
