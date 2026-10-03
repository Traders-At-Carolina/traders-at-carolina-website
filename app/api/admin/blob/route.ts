import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { uploadTokenOptions } from "@/lib/admin/upload-policy";
import { AdminAccessError, requireAdmin } from "@/lib/auth/admin";

/**
 * Issues short-lived tokens so the browser uploads images straight to Blob (spec 06 §6), past the 4.5 MB function
 * body limit. Admins only; the uploaded file's URL is saved by the editor's own server action, so there is no
 * upload-completed callback to secure.
 */
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        await requireAdmin();
        return uploadTokenOptions(pathname);
      },
    });
    return Response.json(result);
  } catch (error) {
    const status = error instanceof AdminAccessError ? 401 : 400;
    return Response.json({ error: (error as Error).message }, { status });
  }
}
