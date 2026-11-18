import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma CLI commands (migrate dev, studio) work with the local SQLite file.
// A remote Turso database (libsql://…) is migrated with `npm run db:deploy`
// instead, so the CLI falls back to the local file in that case.
const databaseUrl = process.env.DATABASE_URL ?? "";
const cliUrl = databaseUrl.startsWith("file:") ? databaseUrl : "file:./prisma/dev.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: cliUrl,
  },
});
