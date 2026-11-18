import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { createAdapter } from "@/lib/dbAdapter";

function createPrismaClient() {
  return new PrismaClient({ adapter: createAdapter() });
}

// Reuse one client across hot reloads in development.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
