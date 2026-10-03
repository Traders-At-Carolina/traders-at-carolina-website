import { listMembers } from "@/lib/admin/members-db";
import { rosterFilter } from "@/lib/admin/members-filter";
import { AdminAccessError, requireAdmin } from "@/lib/auth/admin";
import { toCsv } from "@/lib/members/roster";

/** Export CSV of the current roster filter (spec 06 §6.2). Admins only. */
export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAccessError) return new Response("Admins only", { status: 401 });
    throw error;
  }
  const params = new URL(request.url).searchParams;
  const rows = await listMembers(rosterFilter(params));
  const csv = toCsv(
    rows.map((r) => ({ name: r.name, email: r.email, status: r.status, track: r.track, classYear: r.classYear, cohort: r.cohort, account: r.userId ? "Signed up" : "Not signed up yet" })),
  );
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="members-${date}.csv"`, "cache-control": "no-store" },
  });
}
