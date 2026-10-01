export type InlineToken =
  | { type: "text"; value: string }
  | { type: "em"; value: string }
  | { type: "link"; text: string; href: string };

const PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)|\*([^*]+)\*/g;

/** Parses the minimal Markdown subset allowed in FAQ answers: [links](href) and *emphasis* (spec 05 §5). */
export function parseInline(source: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let last = 0;
  for (const match of source.matchAll(PATTERN)) {
    const at = match.index ?? 0;
    if (at > last) tokens.push({ type: "text", value: source.slice(last, at) });
    if (match[1] !== undefined) tokens.push({ type: "link", text: match[1], href: match[2] });
    else tokens.push({ type: "em", value: match[3] });
    last = at + match[0].length;
  }
  if (last < source.length) tokens.push({ type: "text", value: source.slice(last) });
  return tokens;
}

/** Plain text for JSON-LD and metadata. */
export function inlineToPlainText(source: string): string {
  return parseInline(source)
    .map((t) => (t.type === "link" ? t.text : t.value))
    .join("");
}
