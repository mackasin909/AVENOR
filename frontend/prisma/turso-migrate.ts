// Applies prisma/migrations/*/migration.sql to the database in DATABASE_URL
// (usually Turso). Prisma's own `migrate` commands only work with the local
// SQLite file, so production migrations go through this script:
//
//   npm run db:deploy
//
// Already applied migrations are recorded in the `_avenor_migrations` table
// and skipped, so it is safe to run after every new migration.
import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@libsql/client";
import { getDatabaseConfig } from "../src/lib/dbAdapter.js";

const MIGRATIONS_DIR = path.join(process.cwd(), "prisma", "migrations");

async function main() {
  const config = getDatabaseConfig();
  const client = createClient(config);

  console.log(`Database: ${config.url.replace(/\?.*$/, "")}`);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "_avenor_migrations" (
      "name" TEXT PRIMARY KEY,
      "appliedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const applied = new Set(
    (await client.execute(`SELECT "name" FROM "_avenor_migrations"`)).rows.map(
      (row) => String(row.name)
    )
  );

  const folders = (await readdir(MIGRATIONS_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  let count = 0;

  for (const name of folders) {
    if (applied.has(name)) continue;

    const sql = await readFile(path.join(MIGRATIONS_DIR, name, "migration.sql"), "utf8");
    console.log(`Applying ${name}…`);

    // The migration and its bookkeeping row succeed or fail together.
    await client.executeMultiple(
      `BEGIN;\n${sql}\nINSERT INTO "_avenor_migrations" ("name") VALUES ('${name.replace(/'/g, "''")}');\nCOMMIT;`
    );
    count += 1;
  }

  console.log(count === 0 ? "Database is up to date" : `Applied ${count} migration(s)`);
  client.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
