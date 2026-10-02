import type { ApplyContent } from "@/content/types";
import { parseInline } from "@/lib/inline-markdown";
import { assertNoProblems } from "@/lib/validation";

/** Every content/apply.ts problem (spec 05 §5); empty when valid. */
export function collectApplyProblems(apply: ApplyContent): string[] {
  const problems: string[] = [];

  if (apply.stages.length !== 3) problems.push(`stages must have exactly 3 entries (got ${apply.stages.length})`);
  // Spec 05 asks for 4+; answers are published only once the club has written them, so at least 1 is enforced.
  if (apply.faq.length === 0) problems.push("faq must have at least 1 entry");

  apply.faq.forEach((item, i) => {
    if (!item.question.trim() || !item.answer.trim()) problems.push(`faq[${i}] needs a question and an answer`);
    for (const token of parseInline(item.answer)) {
      if (token.type === "link" && !/^(\/|#|https:\/\/|mailto:)/.test(token.href)) {
        problems.push(`faq[${i}] link "${token.href}" must start with /, #, https:// or mailto:`);
      }
    }
  });

  return problems;
}

/** Fails the build with every content/apply.ts problem listed at once (spec 05 §5). */
export function validateApply(apply: ApplyContent): void {
  assertNoProblems("content/apply.ts", collectApplyProblems(apply));
}
