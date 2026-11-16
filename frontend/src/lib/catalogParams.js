// Catalog URL parameters, shared by server (queries) and client (controls).

export const PAGE_SIZE = 6;

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest listings" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "year_desc", label: "Year: newest first" },
  { value: "year_asc", label: "Year: oldest first" },
  { value: "mileage_asc", label: "Mileage: lowest first" },
];

export const DEFAULT_SORT = "featured";

export const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric"];

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function readString(params, key) {
  const value = first(params[key]);
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(params, key) {
  const raw = readString(params, key);
  if (raw === "") return null;

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

// `params` is a plain object like Next's `searchParams`.
export function parseCatalogParams(params = {}) {
  const sort = readString(params, "sort");
  const page = Math.floor(readNumber(params, "page") ?? 1);

  return {
    search: readString(params, "search"),
    brand: readString(params, "brand"),
    model: readString(params, "model"),
    country: readString(params, "country"),
    fuel: readString(params, "fuel"),
    minPrice: readNumber(params, "minPrice"),
    maxPrice: readNumber(params, "maxPrice"),
    minMileage: readNumber(params, "minMileage"),
    maxMileage: readNumber(params, "maxMileage"),
    minYear: readNumber(params, "minYear"),
    maxYear: readNumber(params, "maxYear"),
    sort: SORT_OPTIONS.some((option) => option.value === sort) ? sort : DEFAULT_SORT,
    page: page >= 1 ? page : 1,
  };
}
