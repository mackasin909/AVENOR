"use server";

import { refresh } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteIds } from "@/lib/cars";

// Returns the user's favorite car ids after the change.
export async function toggleFavorite(carId) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const id = Number(carId);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "invalid car" };
  }

  const key = { userId_carId: { userId: user.id, carId: id } };
  const existing = await prisma.favorite.findUnique({ where: key });

  if (existing) {
    await prisma.favorite.delete({ where: key });
  } else {
    // Only cars from the catalog can be saved.
    const car = await prisma.car.findUnique({ where: { id }, select: { status: true } });
    if (car?.status !== "approved") return { ok: false, error: "invalid car" };

    try {
      await prisma.favorite.create({ data: { userId: user.id, carId: id } });
    } catch (error) {
      // A double click saved it a moment ago: already a favorite.
      if (error?.code !== "P2002") throw error;
    }
  }

  return {
    ok: true,
    added: !existing,
    ids: await getFavoriteIds(user.id),
  };
}

export async function clearFavorites() {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };

  await prisma.favorite.deleteMany({ where: { userId: user.id } });
  refresh();

  return { ok: true, ids: [] };
}
