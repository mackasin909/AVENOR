import "server-only";
import { prisma } from "@/lib/prisma";

const carInclude = {
  images: {
    orderBy: { position: "asc" },
    select: { url: true },
  },
};

// Plain object shape the UI components expect.
function toCar(row) {
  const { images, createdAt, updatedAt, ...car } = row;

  return {
    ...car,
    name: `${car.brand} ${car.model}`,
    images: images.map((image) => image.url),
  };
}

export async function getCars() {
  const rows = await prisma.car.findMany({
    include: carInclude,
    orderBy: { id: "asc" },
  });

  return rows.map(toCar);
}

export async function getCarById(id) {
  if (!Number.isInteger(id) || id <= 0) return null;

  const row = await prisma.car.findUnique({
    where: { id },
    include: carInclude,
  });

  return row ? toCar(row) : null;
}

export async function getFavoriteCars(userId) {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { car: { include: carInclude } },
  });

  return favorites.map((favorite) => toCar(favorite.car));
}

export async function getFavoriteIds(userId) {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { carId: true },
  });

  return favorites.map((favorite) => favorite.carId);
}
