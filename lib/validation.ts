/** Throws one error listing every content problem, so a single build run surfaces them all. */
export function assertNoProblems(label: string, problems: string[]): void {
  if (problems.length > 0) throw new Error(`Invalid ${label}:\n- ${problems.join("\n- ")}`);
}
