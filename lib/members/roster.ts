import type { TrackId } from "@/content/types";
import type { Membership } from "@/lib/members/resolve";

/** Pure roster rules for the Members screen and the resolver (spec 06 §6.2, §9). */

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
const TRACKS: TrackId[] = ["trading", "research", "development"];

export type RosterInputRow = { line: number; email: string; name: string; track?: TrackId; classYear?: number };
export type InvalidRow = { line: number; text: string; reason: string };

/** Splits one CSV line, honouring "quoted, fields" and "" escapes. */
function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((f) => f.trim());
}

/**
 * Reads a pasted list (one `email` or `Name, email` per line) or a CSV with a `name,email[,track,class_year]` header.
 * Emails are lowercased; blank lines are skipped; anything unreadable is reported with its line number.
 */
export function parseRosterInput(text: string): { rows: RosterInputRow[]; invalid: InvalidRow[] } {
  const rows: RosterInputRow[] = [];
  const invalid: InvalidRow[] = [];
  let header: string[] | null = null;
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = i + 1;
    const textLine = raw.trim();
    if (!textLine) return;
    const fields = splitCsv(textLine);
    const lower = fields.map((f) => f.toLowerCase());
    if (!header && lower.includes("email") && !fields.some((f) => EMAIL.test(f))) {
      header = lower.map((f) => f.replace(/\s+/g, "_"));
      return;
    }
    const col = (name: string) => (header ? fields[header.indexOf(name)] : undefined);
    const email = (header ? col("email") : fields.find((f) => EMAIL.test(f)))?.toLowerCase() ?? "";
    if (!EMAIL.test(email)) return void invalid.push({ line, text: textLine, reason: "No valid email address" });
    const name = header ? (col("name") ?? "") : fields.filter((f) => f.toLowerCase() !== email).join(", ");
    const row: RosterInputRow = { line, email, name };
    const track = col("track")?.toLowerCase();
    if (track) {
      if (!TRACKS.includes(track as TrackId)) return void invalid.push({ line, text: textLine, reason: `Unknown track "${track}"` });
      row.track = track as TrackId;
    }
    const year = col("class_year");
    if (year) {
      if (!/^\d{4}$/.test(year)) return void invalid.push({ line, text: textLine, reason: `Class year "${year}" should look like 2027` });
      row.classYear = Number(year);
    }
    rows.push(row);
  });
  return { rows, invalid };
}

/** What "Add members" will do, shown before anything is saved. */
export function previewAdd(rows: RosterInputRow[], onRoster: Set<string>) {
  const seen = new Set<string>();
  const add: RosterInputRow[] = [];
  const existing: RosterInputRow[] = [];
  const duplicates: RosterInputRow[] = [];
  for (const row of rows) {
    if (seen.has(row.email)) duplicates.push(row);
    else if (onRoster.has(row.email)) existing.push(row);
    else add.push(row);
    seen.add(row.email);
  }
  return { add, existing, duplicates };
}

/** A roster row's access (spec 06 §9): active yes, alumni while alumni access is on, inactive or missing no. */
export function membershipFromRow(
  row: { status: "active" | "alumni" | "inactive"; track: TrackId | null } | undefined,
  settings: { alumniAccess: boolean },
): Membership {
  if (!row || row.status === "inactive" || (row.status === "alumni" && !settings.alumniAccess)) return null;
  return row.track ? { status: row.status, track: row.track } : { status: row.status };
}

/** "Ada Lovelace" from a row, or the email's local part when no name was given. */
export function displayName(name: string, email: string): string {
  return name.trim() || email.split("@")[0];
}

export type CsvRow = { name: string; email: string; status: string; track: string | null; classYear: number | null; cohort: string | null; account: string };

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(rows: CsvRow[]): string {
  const head = "name,email,status,track,class_year,cohort,account\n";
  return head + rows.map((r) => [r.name, r.email, r.status, r.track, r.classYear, r.cohort, r.account].map(cell).join(",")).join("\n") + (rows.length ? "\n" : "");
}

/**
 * Undo for a bulk change is allowed only if every row still looks exactly as the batch left it (spec 06 §3), so it
 * never overwrites a later edit to one of them.
 */
export function batchUnchanged(recorded: Array<Record<string, unknown>>, current: Array<Record<string, unknown>>): boolean {
  if (recorded.length !== current.length) return false;
  const byId = new Map(current.map((r) => [r.id, r]));
  return recorded.every((r) => {
    const now = byId.get(r.id);
    return now !== undefined && Object.keys(r).every((k) => JSON.stringify(r[k]) === JSON.stringify(now[k]));
  });
}
