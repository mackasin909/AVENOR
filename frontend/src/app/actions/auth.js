"use server";

import { refresh } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  deleteSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { TOO_MANY, getClientIp, isRateLimited, resetRateLimit } from "@/lib/rateLimit";
import {
  PASSWORD_ERROR,
  PHONE_ERROR,
  USERNAME_ERROR,
  isValidPassword,
  isValidUsername,
  normalizePhone,
} from "@/lib/userValidation";

const MINUTE = 60 * 1000;

// A real hash, so a wrong phone takes as long to check as a wrong password
// (the response time does not reveal which phones have accounts).
const DUMMY_HASH =
  "00000000000000000000000000000000:" + "0".repeat(128);

function isUniqueError(error) {
  return error?.code === "P2002";
}

// What the form shows again after an error (React clears it otherwise).
function formValues(formData) {
  return {
    username: String(formData.get("username") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };
}

export async function signUp(_previousState, formData) {
  const values = formValues(formData);
  const fail = (error) => ({ ok: false, error, values });

  const username = String(formData.get("username") ?? "").trim();
  const phone = normalizePhone(formData.get("phone"));
  const password = String(formData.get("password") ?? "");

  if (!isValidUsername(username)) return fail(USERNAME_ERROR);
  if (!phone) return fail(PHONE_ERROR);
  if (!isValidPassword(password)) return fail(PASSWORD_ERROR);

  const ip = await getClientIp();
  if (await isRateLimited(`signup:ip:${ip}`, { limit: 5, windowMs: 60 * MINUTE })) {
    return fail(TOO_MANY);
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { phone }] },
    select: { username: true },
  });

  if (existing) {
    return fail(
      existing.username === username
        ? "This username is already taken"
        : "This phone number is already registered. Log in instead."
    );
  }

  let user;
  try {
    user = await prisma.user.create({
      data: { username, phone, passwordHash: await hashPassword(password) },
      select: { id: true },
    });
  } catch (error) {
    // Someone registered the same name or phone a moment ago.
    if (isUniqueError(error)) return fail("This username or phone number is already registered");
    throw error;
  }

  await createSession(user.id);
  refresh();

  return { ok: true };
}

export async function logIn(_previousState, formData) {
  const values = formValues(formData);
  const invalid = { ok: false, error: "Wrong phone number or password", values };

  const phone = normalizePhone(formData.get("phone"));
  // Accounts created before country codes were required store the number
  // exactly as it was typed then.
  const legacyPhone = String(formData.get("phoneNational") ?? "").replace(/\D/g, "");
  const password = String(formData.get("password") ?? "");

  if ((!phone && !legacyPhone) || !password) return invalid;

  const ip = await getClientIp();
  const phoneKey = `login:phone:${phone ?? legacyPhone}`;
  const [ipBlocked, phoneBlocked] = await Promise.all([
    isRateLimited(`login:ip:${ip}`, { limit: 30, windowMs: 15 * MINUTE }),
    isRateLimited(phoneKey, { limit: 8, windowMs: 15 * MINUTE }),
  ]);
  if (ipBlocked || phoneBlocked) return { ...invalid, error: TOO_MANY };

  const candidates = [phone, legacyPhone].filter((value) => value && value.length >= 7);
  const user = await prisma.user.findFirst({
    where: { phone: { in: candidates } },
    orderBy: { id: "asc" },
    select: { id: true, passwordHash: true },
  });

  const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk) return invalid;

  await resetRateLimit(phoneKey);
  await createSession(user.id);
  refresh();

  return { ok: true };
}

export async function logOut() {
  await deleteSession();
  refresh();
}
