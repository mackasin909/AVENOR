"use server";

import { refresh } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  deleteSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import {
  PASSWORD_ERROR,
  PHONE_ERROR,
  USERNAME_ERROR,
  isValidPassword,
  isValidUsername,
  normalizePhone,
} from "@/lib/userValidation";

export async function signUp(_previousState, formData) {
  const username = String(formData.get("username") ?? "").trim();
  const phone = normalizePhone(formData.get("phone"));
  const password = String(formData.get("password") ?? "");

  if (!isValidUsername(username)) return { ok: false, error: USERNAME_ERROR };
  if (!phone) return { ok: false, error: PHONE_ERROR };
  if (!isValidPassword(password)) return { ok: false, error: PASSWORD_ERROR };

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { phone }] },
    select: { username: true },
  });

  if (existing) {
    return {
      ok: false,
      error:
        existing.username === username
          ? "This username is already taken"
          : "An account with this phone already exists",
    };
  }

  const user = await prisma.user.create({
    data: { username, phone, passwordHash: await hashPassword(password) },
    select: { id: true },
  });

  await createSession(user.id);
  refresh();

  return { ok: true };
}

export async function logIn(_previousState, formData) {
  const phone = normalizePhone(formData.get("phone"));
  const password = String(formData.get("password") ?? "");
  const invalid = { ok: false, error: "Wrong phone number or password" };

  if (!phone || !password) return invalid;

  const user = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, passwordHash: true },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return invalid;
  }

  await createSession(user.id);
  refresh();

  return { ok: true };
}

export async function logOut() {
  await deleteSession();
  refresh();
}
