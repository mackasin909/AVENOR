"use server";

import { refresh } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  deleteSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

const USERNAME_RE = /^[A-Za-z0-9_.-]{3,32}$/;

function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? digits : null;
}

function readPassword(formData) {
  const password = String(formData.get("password") ?? "");
  return password.length >= 8 && password.length <= 128 ? password : null;
}

export async function signUp(_previousState, formData) {
  const username = String(formData.get("username") ?? "").trim();
  const phone = normalizePhone(formData.get("phone"));
  const password = readPassword(formData);

  if (!USERNAME_RE.test(username)) {
    return {
      ok: false,
      error: "Username must be 3–32 characters: letters, digits, _ . -",
    };
  }
  if (!phone) {
    return { ok: false, error: "Enter a valid phone number" };
  }
  if (!password) {
    return { ok: false, error: "Password must be at least 8 characters" };
  }

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
