import { PrismaLibSql } from "@prisma/adapter-libsql";

// One connection setup for the site and the scripts in prisma/.
//
// Locally:  DATABASE_URL="file:./prisma/dev.db" (SQLite file, no token)
// Vercel:   DATABASE_URL="libsql://<db>-<org>.turso.io" + TURSO_AUTH_TOKEN
export const DEFAULT_DATABASE_URL = "file:./prisma/dev.db";

export function getDatabaseConfig() {
  const url = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
  return { url, authToken };
}

export function createAdapter() {
  return new PrismaLibSql(getDatabaseConfig());
}
