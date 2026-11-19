import { issueSignedToken } from "@vercel/blob";
import { handleUpload, handleUploadPresigned } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/auth";
import {
  BLOB_CONTENT_TYPES,
  MAX_IMAGE_BYTES,
  blobUploadPrefix,
  getBlobMode,
} from "@/lib/uploads";

const UPLOAD_WINDOW_MS = 15 * 60 * 1000;

// Logged-in users may upload only into their own folder (see blobUploadPrefix).
async function checkUpload(pathname) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please log in to upload photos");

  const prefix = blobUploadPrefix(user.id);
  const rest = String(pathname ?? "").slice(prefix.length);
  if (!String(pathname ?? "").startsWith(prefix) || rest === "" || rest.includes("/")) {
    throw new Error("Invalid upload path");
  }
}

// Lets the browser send car photos straight to Vercel Blob (see lib/uploads.js).
export async function POST(request) {
  const mode = getBlobMode();
  if (!mode) {
    return Response.json({ error: "Blob storage is not configured" }, { status: 404 });
  }

  const body = await request.json();

  try {
    if (mode === "presigned") {
      // BLOB_STORE_ID setup: a short-lived signed token, scoped to this one
      // pathname, image types and size, issued via Vercel OIDC.
      const result = await handleUploadPresigned({
        body,
        request,
        getSignedToken: async (pathname) => {
          await checkUpload(pathname);

          const limits = {
            allowedContentTypes: BLOB_CONTENT_TYPES,
            maximumSizeInBytes: MAX_IMAGE_BYTES,
          };

          const token = await issueSignedToken({
            pathname,
            operations: ["put"],
            validUntil: Date.now() + UPLOAD_WINDOW_MS,
            ...limits,
          });

          return { token, urlOptions: { ...limits, allowOverwrite: false } };
        },
      });

      return Response.json(result);
    }

    // BLOB_READ_WRITE_TOKEN setup.
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        await checkUpload(pathname);

        return {
          allowedContentTypes: BLOB_CONTENT_TYPES,
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: true,
        };
      },
    });

    return Response.json(result);
  } catch (error) {
    console.error("Upload token request failed", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}
