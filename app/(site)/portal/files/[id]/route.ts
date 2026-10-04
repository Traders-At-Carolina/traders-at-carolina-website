import { get } from "@vercel/blob";
import { downloadName, privateBlobToken } from "@/lib/admin/upload-policy";
import { getViewer } from "@/lib/auth/viewer";
import { portalFile } from "@/lib/data/portal";
import { audienceViewer } from "@/lib/members/audience";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Every refusal gets this same response, so a file's existence is never revealed (spec 06 §8). */
const notFound = () => new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" } });

/**
 * Streams an uploaded resource from the private Blob store (spec 06 §8 Files). Signed-out visitors go to sign-in and
 * come back here (the same for every id, so nothing is revealed). Signed-in viewers get the file only if the resource
 * exists, isn't hidden, is a file and its audience includes them; otherwise 404. The Blob pathname never leaves the
 * server, and responses are never cached.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  if (!UUID.test(id)) return notFound();

  const viewer = await getViewer();
  if (!viewer) {
    const signIn = `/account/sign-in?redirect_url=${encodeURIComponent(`/portal/files/${id}`)}`;
    return new Response(null, { status: 307, headers: { Location: new URL(signIn, request.url).toString(), "Cache-Control": "private, no-store" } });
  }

  const token = privateBlobToken();
  const allowed = token ? await portalFile(id, audienceViewer(viewer.isMember)) : null;
  if (!token || !allowed) return notFound();

  const blob = await get(allowed.file.pathname, { access: "private", token, useCache: false });
  if (!blob || blob.statusCode !== 200) return notFound();

  const name = downloadName(allowed.title, allowed.file.pathname);
  return new Response(blob.stream, {
    headers: {
      "Content-Type": allowed.file.contentType,
      "Content-Disposition": `inline; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      ...(blob.blob.size ? { "Content-Length": String(blob.blob.size) } : {}),
    },
  });
}
