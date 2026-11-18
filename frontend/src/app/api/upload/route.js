import { handleUpload } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/auth";
import {
  BLOB_CONTENT_TYPES,
  MAX_IMAGE_BYTES,
  isBlobEnabled,
} from "@/lib/uploads";

// Issues short-lived upload tokens so the browser can send car photos
// straight to Vercel Blob (see lib/uploads.js). Logged-in users only.
export async function POST(request) {
  if (!isBlobEnabled()) {
    return Response.json({ error: "Blob storage is not configured" }, { status: 404 });
  }

  const body = await request.json();

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getCurrentUser();
        if (!user) throw new Error("Please log in to upload photos");
        if (!pathname.startsWith("cars/")) throw new Error("Invalid upload path");

        return {
          allowedContentTypes: BLOB_CONTENT_TYPES,
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: true,
        };
      },
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
