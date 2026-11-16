// Grants (or revokes) the admin role.
//   npm run make-admin -- <username or phone>
//   npm run make-admin -- <username or phone> --revoke
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const [identifier, flag] = process.argv.slice(2);

  if (!identifier) {
    console.error("Usage: npm run make-admin -- <username or phone> [--revoke]");
    process.exitCode = 1;
    return;
  }

  const phone = identifier.replace(/\D/g, "");
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: identifier }, ...(phone ? [{ phone }] : [])],
    },
  });

  if (!user) {
    console.error(`No user found for "${identifier}"`);
    process.exitCode = 1;
    return;
  }

  const role = flag === "--revoke" ? "user" : "admin";
  await prisma.user.update({ where: { id: user.id }, data: { role } });
  console.log(`${user.username} is now ${role}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
