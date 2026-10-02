/** `phrase` is how the stat reads as a sentence ("Founded in 2023") when it stands alone as a heading. */
export type StatItem = { value?: string; label: string; phrase?: string };
type Tone = "default" | "inverse";

/** Large tabular number over a caption label (00 §7.4): navy on light sections, bone on dark. */
export function Stat({ value, label, tone = "default" }: { value: string; label: string; tone?: Tone }) {
  return (
    <li className="flex flex-col gap-2 py-6 first:pt-0 last:pb-0 md:px-8 md:py-0 md:first:pl-0 md:last:pr-0">
      <span className={`text-stat font-medium tabular ${tone === "inverse" ? "text-bone" : "text-navy"}`}>{value}</span>
      <span className={`text-caption ${tone === "inverse" ? "text-bone/70" : "text-ink-3"}`}>{label}</span>
    </li>
  );
}

/** Stats separated by hairlines; entries without a value are dropped, never padded. */
export function StatRow({ stats, tone = "default" }: { stats: StatItem[]; tone?: Tone }) {
  const shown = stats.filter((s): s is StatItem & { value: string } => Boolean(s.value));
  if (shown.length === 0) return null;

  return (
    <ul
      className={`flex flex-col divide-y md:flex-row md:divide-x md:divide-y-0 ${
        tone === "inverse" ? "divide-rule-inverse" : "divide-rule"
      }`}
    >
      {shown.map((s) => (
        <Stat key={s.label} value={s.value} label={s.label} tone={tone} />
      ))}
    </ul>
  );
}
