import { readCarImage } from "@/lib/uploads";

export async function GET(_request, { params }) {
  const { name } = await params;
  const image = await readCarImage(name);

  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(image.bytes, {
    headers: {
      "Content-Type": image.contentType,
      // File names are random and never reused.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
