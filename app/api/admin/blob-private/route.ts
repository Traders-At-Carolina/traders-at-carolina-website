import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { privateBlobToken, privateUploadTokenOptions } from "@/lib/admin/upload-policy";
import { AdminAccessError, requireAdmin } from "@/lib/auth/admin";

/**
 * Issues short-lived tokens so the browser uploads resource files straight to the private Blob store (spec 06 §6.11),
 * past the 4.5 MB function body limit. Admins only. The private store's token is passed explicitly, since the default
 * BLOB_READ_WRITE_TOKEN belongs to the public image store. The file's pathname is saved by the Resource form's own
 * server action, so there is no upload-completed callback to secure.
 */
export async function POST(request: Request): Promise<Response> {
  const token = privateBlobToken();
  if (!token) return Response.json({ error: "The private file store isn't set up." }, { status: 503 });
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async (pathname) => {
        await requireAdmin();
        return privateUploadTokenOptions(pathname);
      },
    });
    return Response.json(result);
  } catch (error) {
    const status = error instanceof AdminAccessError ? 401 : 400;
    return Response.json({ error: (error as Error).message }, { status });
  }
}
