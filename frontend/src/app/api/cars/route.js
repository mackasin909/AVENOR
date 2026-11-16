import { getCarsByIds } from "@/lib/cars";

// GET /api/cars?ids=1,2,3 → approved cars in the same order (max 12).
// Used by the "Recently viewed" section, whose ids live in localStorage.
export async function GET(request) {
  const raw = new URL(request.url).searchParams.get("ids") ?? "";
  const ids = raw
    .split(",")
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, 12);

  const cars = await getCarsByIds(ids);

  return Response.json(
    cars.map(({ id, name, year, price, location, images }) => ({
      id,
      name,
      year,
      price,
      location,
      images,
    }))
  );
}
