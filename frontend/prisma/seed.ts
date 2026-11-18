import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { createAdapter } from "../src/lib/dbAdapter.js";
import { CARS_DATA } from "./cars-data.js";

const prisma = new PrismaClient({ adapter: createAdapter() });

function countryFrom(location: string) {
  return location.split(",").at(-1)?.trim() ?? "";
}

async function main() {
  for (const { id, images, ...car } of CARS_DATA) {
    const data = { ...car, country: countryFrom(car.location) };
    const imageRows = images.map((url: string, position: number) => ({
      url,
      position,
    }));

    // Idempotent: re-running the seed refreshes cars and their photos.
    await prisma.car.upsert({
      where: { id },
      create: { id, ...data, images: { create: imageRows } },
      update: { ...data, images: { deleteMany: {}, create: imageRows } },
    });
  }

  console.log(`Seeded ${CARS_DATA.length} cars`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
