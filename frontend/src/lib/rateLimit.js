import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// Visitor IP as reported by the hosting proxy (Vercel sets both headers).
export async function getClientIp() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || requestHeaders.get("x-real-ip") || "unknown";
}

// Counts one attempt for `key` and tells whether the limit is exceeded:
// at most `limit` attempts per `windowMs`. Stored in the database because
// serverless functions do not share memory.
//
// If the table is missing (migration not applied yet), requests are let
// through rather than breaking log in.
export async function isRateLimited(key, { limit, windowMs }) {
  const now = new Date();

  try {
    const row = await prisma.rateLimit.findUnique({ where: { key } });

    if (!row || row.resetAt <= now) {
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
        update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
      });
      return false;
    }

    const { count } = await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
      select: { count: true },
    });

    return count > limit;
  } catch (error) {
    console.error("Rate limit check failed", error);
    return false;
  }
}

// Forgets the attempts for `key` (e.g. after a successful log in).
export async function resetRateLimit(key) {
  await prisma.rateLimit.deleteMany({ where: { key } }).catch(() => {});
}

export const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";
