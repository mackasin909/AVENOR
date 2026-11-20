"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isValidEmail } from "@/lib/validation";
import { TOO_MANY, getClientIp, isRateLimited } from "@/lib/rateLimit";
import { whatsAppPhoneFor } from "@/lib/whatsapp";

const LIMITS = {
  name: { min: 2, max: 80 },
  message: { min: 5, max: 2000 },
};

function readText(formData, key) {
  return String(formData.get(key) ?? "").trim();
}

function inRange(value, { min, max }) {
  return value.length >= min && value.length <= max;
}

async function getSiteOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) return null;

  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${protocol}://${host}`;
}

function buildWhatsAppText({ car, name, email, message, carUrl, inquiryId }) {
  return [
    `New inquiry #${inquiryId} — AVENOR`,
    "",
    `Car: ${car.year} ${car.brand} ${car.model}`,
    `Price: $${car.price.toLocaleString("en-US")}`,
    carUrl ? `Link: ${carUrl}` : null,
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    "",
    message,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export async function createInquiry(_previousState, formData) {
  const carId = Number(formData.get("carId"));
  const name = readText(formData, "name");
  const email = readText(formData, "email");
  const message = readText(formData, "message");

  const errors = {};
  if (!inRange(name, LIMITS.name)) {
    errors.name = `Name must be ${LIMITS.name.min}–${LIMITS.name.max} characters`;
  }
  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email, e.g. name@example.com";
  }
  if (!inRange(message, LIMITS.message)) {
    errors.message = `Message must be ${LIMITS.message.min}–${LIMITS.message.max} characters`;
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  // Against spam: a few inquiries per visitor every 10 minutes.
  const ip = await getClientIp();
  if (await isRateLimited(`inquiry:ip:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 })) {
    return { ok: false, errors: { form: TOO_MANY } };
  }

  const car = Number.isInteger(carId) && carId > 0
    ? await prisma.car.findUnique({
        where: { id: carId },
        select: {
          id: true,
          year: true,
          brand: true,
          model: true,
          price: true,
          status: true,
          ownerId: true,
          owner: { select: { phone: true } },
        },
      })
    : null;

  if (!car || car.status !== "approved") {
    return { ok: false, errors: { form: "This car is no longer available" } };
  }

  const user = await getCurrentUser();

  const inquiry = await prisma.inquiry.create({
    data: { carId: car.id, userId: user?.id ?? null, name, email, message },
    select: { id: true },
  });

  // Dealer cars go to the dealer number; user listings to the seller,
  // for logged-in buyers only (see lib/whatsapp.js).
  const phone = whatsAppPhoneFor(
    { ownerId: car.ownerId, ownerPhone: car.owner?.phone },
    user
  );
  let whatsappUrl = null;

  if (phone) {
    const origin = await getSiteOrigin();
    const text = buildWhatsAppText({
      car,
      name,
      email,
      message,
      carUrl: origin ? `${origin}/car/${car.id}` : null,
      inquiryId: inquiry.id,
    });
    whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  return { ok: true, inquiryId: inquiry.id, whatsappUrl };
}
