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

// Returns { url } or { error }.
export async function saveCarImage(file) {
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
  await mkdir(CARS_DIR, { recursive: true });
  await writeFile(path.join(CARS_DIR, name), bytes);

  return { url: `${PUBLIC_PREFIX}${name}` };
}

export function isUploadedUrl(url) {
  return typeof url === "string" && url.startsWith(PUBLIC_PREFIX);
}

// Deletes our own uploaded files; external URLs are ignored.
export async function deleteUploadedImages(urls) {
  await Promise.all(
    urls.filter(isUploadedUrl).map(async (url) => {
      const name = url.slice(PUBLIC_PREFIX.length);
      if (!FILE_NAME_RE.test(name)) return;
      await unlink(path.join(CARS_DIR, name)).catch(() => {});
    })
  );
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
