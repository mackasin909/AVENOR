import "server-only";
import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { PAGE_SIZE } from "@/lib/catalogParams";
import { correctWord, tokenize } from "@/lib/fuzzy";

const carInclude = {
  images: {
    orderBy: { position: "asc" },
    select: { url: true },
  },
};

const PUBLIC = { status: "approved" };

// Plain object shape the UI components expect.
export function toCar(row) {
  const { images, createdAt, updatedAt, owner, ...car } = row;

  return {
    ...car,
    name: `${car.brand} ${car.model}`,
    images: images.map((image) => image.url),
    createdAt: createdAt?.toISOString?.() ?? null,
  };
}

export function countryFrom(location) {
  return String(location ?? "").split(",").at(-1)?.trim() ?? "";
}

// ---------- catalog ----------

const SORT_ORDER = {
  featured: [{ id: "asc" }],
  newest: [{ createdAt: "desc" }, { id: "desc" }],
  price_asc: [{ price: "asc" }, { id: "asc" }],
  price_desc: [{ price: "desc" }, { id: "asc" }],
  year_desc: [{ year: "desc" }, { id: "asc" }],
  year_asc: [{ year: "asc" }, { id: "asc" }],
  mileage_asc: [{ mileage: "asc" }, { id: "asc" }],
};

function range(min, max) {
  const filter = {};
  if (min !== null) filter.gte = min;
  if (max !== null) filter.lte = max;
  return Object.keys(filter).length > 0 ? filter : undefined;
}

const SEARCH_FIELDS = ["brand", "model", "location", "fuelType", "engine", "gearbox"];

// All words of the approved cars, for correcting typos. Built once per
// request (the catalog is small, so one light query is enough).
const getSearchVocabulary = cache(async () => {
  const cars = await prisma.car.findMany({
    where: PUBLIC,
    select: Object.fromEntries(SEARCH_FIELDS.map((field) => [field, true])),
  });

  return [
    ...new Set(
      cars.flatMap((car) => tokenize(SEARCH_FIELDS.map((field) => car[field]).join(" ")))
    ),
  ];
});

// Splits the query into words and replaces typos with catalog words.
// Returns the words to search for and the corrected query to show
// ("porhe 911" → "porsche 911"), or null when nothing was corrected.
export async function resolveSearch(search) {
  // "%" and "_" would act as LIKE wildcards ("%" matched every car), so
  // they separate words like spaces do ("e_tron" → "e tron").
  const words = search
    .toLowerCase()
    .replace(/[%_\\]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
  if (words.length === 0) {
    // Only symbols were typed: nothing to search for, so nothing matches.
    return { words: [], corrected: null, nothing: search.trim() !== "" };
  }

  const vocabulary = await getSearchVocabulary();
  const resolved = words.map((word) => ({ word, ...correctWord(word, vocabulary) }));
  const anyCorrected = resolved.some((item) => item.corrected);

  return {
    words: resolved,
    corrected: anyCorrected
      ? resolved.map((item) => (item.corrected ? item.terms[0] : item.word)).join(" ")
      : null,
  };
}

function searchWhere(words) {
  // Every word must match at least one field; a corrected word may match
  // any of its close catalog words (SQLite LIKE is case-insensitive for
  // latin letters).
  return words.map(({ terms }) => {
    const or = terms.flatMap((term) =>
      SEARCH_FIELDS.map((field) => ({ [field]: { contains: term } }))
    );

    for (const term of terms) {
      if (/^\d{4}$/.test(term)) or.push({ year: Number(term) });
    }

    return { OR: or };
  });
}

export function buildCatalogWhere(filters, words = []) {
  const and = [PUBLIC, ...searchWhere(words)];

  if (filters.brand) and.push({ brand: filters.brand });
  if (filters.brand && filters.model) and.push({ model: filters.model });
  if (filters.country) and.push({ country: filters.country });
  if (filters.fuel) and.push({ fuelType: filters.fuel });

  const price = range(filters.minPrice, filters.maxPrice);
  const mileage = range(filters.minMileage, filters.maxMileage);
  const year = range(filters.minYear, filters.maxYear);
  if (price) and.push({ price });
  if (mileage) and.push({ mileage });
  if (year) and.push({ year });

  return { AND: and };
}

export async function searchCatalog(filters) {
  const search = await resolveSearch(filters.search);
  const where = search.nothing
    ? { id: -1 }
    : buildCatalogWhere(filters, search.words);
  const total = await prisma.car.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);

  const rows = await prisma.car.findMany({
    where,
    include: carInclude,
    orderBy: SORT_ORDER[filters.sort] ?? SORT_ORDER.featured,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return {
    cars: rows.map(toCar),
    total,
    page,
    pageCount,
    correctedQuery: search.corrected,
  };
}

// Options and bounds for the filter panel (approved cars only).
export async function getCatalogFacets() {
  const [options, bounds] = await Promise.all([
    prisma.car.findMany({
      where: PUBLIC,
      select: { brand: true, model: true, country: true, fuelType: true },
      orderBy: [{ brand: "asc" }, { model: "asc" }],
    }),
    prisma.car.aggregate({
      where: PUBLIC,
      _min: { price: true, mileage: true, year: true },
      _max: { price: true, mileage: true, year: true },
    }),
  ]);

  const bound = (key) =>
    bounds._min[key] === null
      ? null
      : { min: bounds._min[key], max: bounds._max[key] };

  return {
    cars: options,
    fuels: [...new Set(options.map((car) => car.fuelType))].sort(),
    priceBounds: bound("price"),
    mileageBounds: bound("mileage"),
    yearBounds: bound("year"),
  };
}

export async function getFeaturedCars(take = 4) {
  const rows = await prisma.car.findMany({
    where: PUBLIC,
    include: carInclude,
    orderBy: { id: "asc" },
    take,
  });

  return rows.map(toCar);
}

// ---------- single car ----------

// Public visitors only see approved cars; the owner and admins can also
// open pending or rejected listings.
export const getCarById = cache(async (id, viewer = null) => {
  if (!Number.isInteger(id) || id <= 0) return null;

  const row = await prisma.car.findUnique({
    where: { id },
    include: carInclude,
  });

  if (!row) return null;

  const canSee =
    row.status === "approved" ||
    viewer?.role === "admin" ||
    (viewer && row.ownerId === viewer.id);

  return canSee ? toCar(row) : null;
});

export async function getCarsByIds(ids) {
  const unique = [...new Set(ids)].filter((id) => Number.isInteger(id) && id > 0);
  if (unique.length === 0) return [];

  const rows = await prisma.car.findMany({
    where: { ...PUBLIC, id: { in: unique } },
    include: carInclude,
  });

  const byId = new Map(rows.map((row) => [row.id, toCar(row)]));
  return unique.map((id) => byId.get(id)).filter(Boolean);
}

// Same brand first, then cars closest in price (±40%).
export async function getSimilarCars(car, take = 3) {
  const rows = await prisma.car.findMany({
    where: {
      ...PUBLIC,
      id: { not: car.id },
      OR: [
        { brand: car.brand },
        { price: { gte: Math.round(car.price * 0.6), lte: Math.round(car.price * 1.4) } },
      ],
    },
    include: carInclude,
    take: 24,
  });

  return rows
    .sort((a, b) => {
      const brandA = a.brand === car.brand ? 0 : 1;
      const brandB = b.brand === car.brand ? 0 : 1;
      if (brandA !== brandB) return brandA - brandB;
      return Math.abs(a.price - car.price) - Math.abs(b.price - car.price);
    })
    .slice(0, take)
    .map(toCar);
}

// ---------- favorites ----------

export async function getFavoriteCars(userId) {
  const favorites = await prisma.favorite.findMany({
    where: { userId, car: PUBLIC },
    orderBy: { createdAt: "asc" },
    include: { car: { include: carInclude } },
  });

  return favorites.map((favorite) => toCar(favorite.car));
}

export async function getFavoriteIds(userId) {
  const favorites = await prisma.favorite.findMany({
    where: { userId, car: PUBLIC },
    orderBy: { createdAt: "asc" },
    select: { carId: true },
  });

  return favorites.map((favorite) => favorite.carId);
}

// ---------- listings management ----------

// Cars for the admin table or a user's "My listings" (any status).
export async function getManagedCars({ ownerId, status } = {}) {
  const rows = await prisma.car.findMany({
    where: {
      ...(ownerId !== undefined ? { ownerId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      ...carInclude,
      owner: { select: { username: true } },
      _count: { select: { inquiries: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return rows.map(({ _count, ...row }) => ({
    ...toCar(row),
    ownerName: row.owner?.username ?? null,
    inquiryCount: _count.inquiries,
  }));
}

// Car for the edit form, if the user may edit it.
export async function getEditableCar(id, user) {
  if (!user || !Number.isInteger(id) || id <= 0) return null;

  const row = await prisma.car.findUnique({ where: { id }, include: carInclude });
  if (!row) return null;

  const allowed = user.role === "admin" || (row.ownerId !== null && row.ownerId === user.id);
  return allowed ? toCar(row) : null;
}
