"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  hashPassword,
  revokeAllSessions,
  revokeOtherSessions,
  verifyPassword,
} from "@/lib/auth";
import { deleteUploadedImages } from "@/lib/uploads";
import {
  PASSWORD_ERROR,
  PHONE_ERROR,
  USERNAME_ERROR,
  isValidPassword,
  isValidUsername,
  normalizePhone,
} from "@/lib/userValidation";

const UNAUTHORIZED = { ok: false, error: "Please log in again" };

export async function updateProfile(_previousState, formData) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;

  const username = String(formData.get("username") ?? "").trim();
  const phone = normalizePhone(formData.get("phone"));

  if (!isValidUsername(username)) return { ok: false, error: USERNAME_ERROR };
  if (!phone) return { ok: false, error: PHONE_ERROR };

  const taken = await prisma.user.findFirst({
    where: {
      id: { not: user.id },
      OR: [{ username }, { phone }],
    },
    select: { username: true },
  });

  if (taken) {
    return {
      ok: false,
      error:
        taken.username === username
          ? "This username is already taken"
          : "Another account already uses this phone",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { username, phone },
  });

  refresh();
  return { ok: true, message: "Profile updated" };
}

export async function changePassword(_previousState, formData) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!isValidPassword(next)) return { ok: false, error: PASSWORD_ERROR };
  if (next !== confirm) return { ok: false, error: "New passwords do not match" };

  const { passwordHash } = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!(await verifyPassword(current, passwordHash))) {
    return { ok: false, error: "Current password is wrong" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });

  // Anyone who knew the old password is logged out everywhere else.
  const revoked = await revokeOtherSessions(user.id);

  refresh();
  return {
    ok: true,
    message:
      revoked > 0
        ? `Password changed. Logged out of ${revoked} other session${revoked === 1 ? "" : "s"}.`
        : "Password changed",
  };
}

export async function logOutEverywhere() {
  const user = await getCurrentUser();
  if (user) await revokeAllSessions(user.id);
  redirect("/");
}

export async function deleteAccount(_previousState, formData) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;

  const password = String(formData.get("password") ?? "");
  const { passwordHash } = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!(await verifyPassword(password, passwordHash))) {
    return { ok: false, error: "Wrong password" };
  }

  // Listings are deleted with the account; remove their uploaded photos too.
  const images = await prisma.carImage.findMany({
    where: { car: { ownerId: user.id } },
    select: { url: true },
  });

  await revokeAllSessions(user.id);
  await prisma.user.delete({ where: { id: user.id } });
  await deleteUploadedImages(images.map((image) => image.url));

  redirect("/");
}
