export type StatItem = { value?: string; label: string };

/** Large navy tabular number over a caption label (00 §7.4). */
export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <li className="flex flex-col gap-2 py-6 first:pt-0 last:pb-0 md:px-8 md:py-0 md:first:pl-0 md:last:pr-0">
      <span className="text-stat font-medium text-navy tabular">{value}</span>
      <span className="text-caption text-ink-3">{label}</span>
    </li>
  );
}

/** Stats separated by hairlines; entries without a value are dropped, never padded. */
export function StatRow({ stats }: { stats: StatItem[] }) {
  const shown = stats.filter((s): s is Required<StatItem> => Boolean(s.value));
  if (shown.length === 0) return null;

  return (
    <ul className="flex flex-col divide-y divide-rule md:flex-row md:divide-x md:divide-y-0">
      {shown.map((s) => (
        <Stat key={s.label} value={s.value} label={s.label} />
      ))}
    </ul>
  );
}
