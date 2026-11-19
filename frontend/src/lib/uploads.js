import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Uploaded photos live outside `public/` (Next only serves files that
// existed in `public/` at build time) and are served by
// app/uploads/cars/[name]/route.js.
const CARS_DIR = path.join(process.cwd(), "uploads", "cars");
const PUBLIC_PREFIX = "/uploads/cars/";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGES_PER_CAR = 10;

const FILE_NAME_RE = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

export const CONTENT_TYPES = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Detect the real format from the file header, not the browser's claim.
function detectExtension(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  ) return "png";
  if (
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) return "webp";
  return null;
}

// Hosting with a read-only, temporary disk (Vercel) cannot keep uploads in
// the uploads/ folder; photos then need a connected Vercel Blob store.
const STORAGE_MISSING_ERROR =
  "Photo storage is not set up on this server. Connect a Vercel Blob store to the project and redeploy.";

// Returns { url } or { error }.
export async function saveCarImage(file) {
  if (process.env.VERCEL && !isBlobEnabled()) {
    console.error("Photo upload failed: no Vercel Blob store is connected (BLOB_STORE_ID or BLOB_READ_WRITE_TOKEN)");
    return { error: STORAGE_MISSING_ERROR };
  }

  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
    return { error: "Empty file" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: `${file.name || "Photo"} is larger than 8 MB` };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = detectExtension(bytes);

  if (!extension) {
    return { error: `${file.name || "Photo"} is not a JPEG, PNG or WebP image` };
  }

  const name = `${randomUUID()}.${extension}`;

  try {
    await mkdir(CARS_DIR, { recursive: true });
    await writeFile(path.join(CARS_DIR, name), bytes);
  } catch (error) {
    // e.g. a read-only disk: report it in the form instead of a 500 page.
    console.error("Failed to save photo to disk", error);
    return { error: STORAGE_MISSING_ERROR };
  }

  return { url: `${PUBLIC_PREFIX}${name}` };
}

export function isUploadedUrl(url) {
  return typeof url === "string" && url.startsWith(PUBLIC_PREFIX);
}

// ---------- Vercel Blob (production) ----------
//
// On Vercel the disk is temporary and requests are limited to ~4.5 MB, so
// the browser uploads photos straight to Vercel Blob (app/api/upload) and
// the form only sends back the resulting URLs. Otherwise photos are saved to
// uploads/ as above.
//
// Two ways a Blob store can be connected to the project:
// - "token":     BLOB_READ_WRITE_TOKEN (older setup) → upload() / handleUpload()
// - "presigned": BLOB_STORE_ID + BLOB_WEBHOOK_PUBLIC_KEY (current Vercel
//                setup, authenticated with Vercel OIDC) →
//                uploadPresigned() / handleUploadPresigned()

export const BLOB_CONTENT_TYPES = Object.values(CONTENT_TYPES);

export function getBlobMode() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "token";
  if (process.env.BLOB_STORE_ID) return "presigned";
  return null;
}

export function isBlobEnabled() {
  return getBlobMode() !== null;
}

// ID of OUR Blob store, parsed the same way @vercel/blob does: from the
// read-write token (vercel_blob_rw_<storeId>_<secret>) or BLOB_STORE_ID
// (with an optional "store_" prefix).
function getBlobStoreId() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const [, , , storeId = ""] = token.split("_");
    return storeId || null;
  }

  const storeId = String(process.env.BLOB_STORE_ID ?? "").trim();
  if (!storeId) return null;
  return storeId.startsWith("store_") ? storeId.slice("store_".length) : storeId;
}

// Public files are served from https://<storeId>.public.blob.vercel-storage.com.
function getBlobStoreHost() {
  const storeId = getBlobStoreId();
  return storeId ? `${storeId}.public.blob.vercel-storage.com`.toLowerCase() : null;
}

// Every user uploads into their own folder; /api/upload enforces it, so a
// file in cars/<id>/ was uploaded by user <id>.
export function blobUploadPrefix(userId) {
  return `cars/${userId}/`;
}

function parseBlobUrl(url) {
  const host = getBlobStoreHost();
  if (!host) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.hostname.toLowerCase() !== host) return null;
    return parsed;
  } catch {
    return null;
  }
}

// A file in our Blob store (any other host is not ours to delete).
export function isBlobUrl(url) {
  return parseBlobUrl(url) !== null;
}

// A file in our store that this user uploaded.
export function isOwnBlobUrl(url, userId) {
  const parsed = parseBlobUrl(url);
  return Boolean(parsed) && parsed.pathname.startsWith(`/${blobUploadPrefix(userId)}`);
}

// Deletes our own uploaded files (local or Blob); external URLs are ignored.
export async function deleteUploadedImages(urls) {
  const blobUrls = isBlobEnabled() ? urls.filter(isBlobUrl) : [];

  await Promise.all([
    ...urls.filter(isUploadedUrl).map(async (url) => {
      const name = url.slice(PUBLIC_PREFIX.length);
      if (!FILE_NAME_RE.test(name)) return;
      await unlink(path.join(CARS_DIR, name)).catch(() => {});
    }),
    blobUrls.length > 0
      ? import("@vercel/blob")
          .then(({ del }) => del(blobUrls))
          .catch((error) => console.error("Failed to delete blobs", error))
      : null,
  ]);
}

// Returns { bytes, contentType } or null.
export async function readCarImage(name) {
  const match = FILE_NAME_RE.exec(name);
  if (!match) return null;

  try {
    const bytes = await readFile(path.join(CARS_DIR, name));
    return { bytes, contentType: CONTENT_TYPES[match[1]] };
  } catch {
    return null;
  }
}
