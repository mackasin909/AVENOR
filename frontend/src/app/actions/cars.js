"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { countryFrom } from "@/lib/cars";
import { FUEL_TYPES } from "@/lib/catalogParams";
import {
  MAX_IMAGES_PER_CAR,
  deleteUploadedImages,
  isBlobEnabled,
  isOwnBlobUrl,
  saveCarImage,
} from "@/lib/uploads";

const MAX_YEAR = new Date().getFullYear() + 1;

const TEXT_FIELDS = {
  brand: { label: "Make", min: 1, max: 40 },
  model: { label: "Model", min: 1, max: 60 },
  engine: { label: "Engine", min: 1, max: 60 },
  gearbox: { label: "Gearbox", min: 1, max: 60 },
  location: { label: "Location", min: 3, max: 120 },
  description: { label: "Description", min: 20, max: 5000 },
};

const NUMBER_FIELDS = {
  year: { label: "Year", min: 1900, max: MAX_YEAR },
  price: { label: "Price", min: 1, max: 1_000_000_000 },
  mileage: { label: "Mileage", min: 0, max: 2_000_000 },
};

function readCarFields(formData) {
  const values = {};
  const errors = {};

  for (const [key, rule] of Object.entries(TEXT_FIELDS)) {
    const value = String(formData.get(key) ?? "").trim();
    values[key] = value;
    if (value.length < rule.min || value.length > rule.max) {
      errors[key] = `${rule.label} must be ${rule.min}–${rule.max} characters`;
    }
  }

  for (const [key, rule] of Object.entries(NUMBER_FIELDS)) {
    const raw = String(formData.get(key) ?? "").replace(/[\s,]/g, "");
    values[key] = raw;
    const value = Number(raw);
    if (raw === "" || !Number.isInteger(value) || value < rule.min || value > rule.max) {
      errors[key] = `${rule.label} must be a whole number from ${rule.min.toLocaleString("en-US")} to ${rule.max.toLocaleString("en-US")}`;
    }
  }

  values.fuelType = String(formData.get("fuelType") ?? "");
  if (!FUEL_TYPES.includes(values.fuelType)) {
    errors.fuelType = "Choose a fuel type";
  }

  return { values, errors };
}

function canManage(user, car) {
  return user.role === "admin" || (car.ownerId !== null && car.ownerId === user.id);
}

function listPath(user) {
  return user.role === "admin" ? "/admin/cars" : "/my-listings";
}

export async function saveCar(_previousState, formData) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, errors: { form: "Please log in again" } };

  const id = Number(formData.get("id")) || null;
  const { values, errors } = readCarFields(formData);

  // Photos the browser already uploaded to Vercel Blob (production). Only
  // files this user uploaded to OUR store, and not used by any listing yet,
  // are accepted: a form cannot claim (and later delete) someone else's photo.
  const submittedBlobUrls = isBlobEnabled()
    ? [...new Set(formData.getAll("uploadedImage").map(String))]
    : [];
  const ownBlobUrls = submittedBlobUrls.filter((url) => isOwnBlobUrl(url, user.id));
  const usedUrls = ownBlobUrls.length
    ? new Set(
        (
          await prisma.carImage.findMany({
            where: { url: { in: ownBlobUrls } },
            select: { url: true },
          })
        ).map((image) => image.url)
      )
    : new Set();
  const blobUrls = ownBlobUrls.filter((url) => !usedUrls.has(url));

  if (blobUrls.length !== submittedBlobUrls.length) {
    errors.photos = "Some photos could not be used, please choose them again";
  }

  // On failure the form is reset, so photos uploaded for this attempt are
  // removed again; the user picks them once more. Only the files that passed
  // the checks above are ever deleted here.
  const fail = async (extra = {}) => {
    await deleteUploadedImages(blobUrls);
    return { ok: false, errors: { ...errors, ...extra }, values };
  };

  let existing = null;
  if (id) {
    existing = await prisma.car.findUnique({
      where: { id },
      include: { images: { orderBy: { position: "asc" } } },
    });
    if (!existing || !canManage(user, existing)) {
      return fail({ form: "You cannot edit this listing" });
    }
  }

  // Photos the user kept, in the chosen order; only the car's own photos.
  const currentUrls = existing?.images.map((image) => image.url) ?? [];
  const keptUrls = formData
    .getAll("keepImage")
    .map(String)
    .filter((url, index, all) => currentUrls.includes(url) && all.indexOf(url) === index);

  const newFiles = formData
    .getAll("photos")
    .filter((file) => typeof file === "object" && file !== null && file.size > 0);

  const total = keptUrls.length + blobUrls.length + newFiles.length;
  if (total === 0) errors.photos = "Add at least one photo";
  if (total > MAX_IMAGES_PER_CAR) {
    errors.photos = `Up to ${MAX_IMAGES_PER_CAR} photos per car`;
  }

  if (Object.keys(errors).length > 0) return fail();

  const uploadedUrls = [];
  for (const file of newFiles) {
    const result = await saveCarImage(file);
    if (result.error) {
      await deleteUploadedImages(uploadedUrls);
      return fail({ photos: result.error });
    }
    uploadedUrls.push(result.url);
  }

  const imageRows = [...keptUrls, ...blobUrls, ...uploadedUrls].map((url, position) => ({
    url,
    position,
  }));

  const data = {
    brand: values.brand,
    model: values.model,
    year: Number(values.year),
    price: Number(values.price),
    mileage: Number(values.mileage),
    engine: values.engine,
    gearbox: values.gearbox,
    fuelType: values.fuelType,
    location: values.location,
    country: countryFrom(values.location),
    description: values.description,
  };

  // Admin changes keep the current status; user edits go back to review.
  const moderation =
    user.role === "admin"
      ? existing
        ? {}
        : { status: "approved", statusNote: null }
      : { status: "pending", statusNote: null };

  try {
    if (existing) {
      await prisma.car.update({
        where: { id: existing.id },
        data: {
          ...data,
          ...moderation,
          images: { deleteMany: {}, create: imageRows },
        },
      });
    } else {
      await prisma.car.create({
        data: {
          ...data,
          ...moderation,
          ownerId: user.role === "admin" ? null : user.id,
          images: { create: imageRows },
        },
      });
    }
  } catch (error) {
    console.error("Failed to save car", error);
    await deleteUploadedImages(uploadedUrls);
    return fail({ form: "Could not save the listing, please try again" });
  }

  // Photos removed in the editor.
  await deleteUploadedImages(currentUrls.filter((url) => !keptUrls.includes(url)));

  redirect(listPath(user));
}

export async function deleteCar(carId) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in again" };

  const car = await prisma.car.findUnique({
    where: { id: Number(carId) },
    include: { images: { select: { url: true } } },
  });

  if (!car || !canManage(user, car)) {
    return { ok: false, error: "You cannot delete this listing" };
  }

  await prisma.car.delete({ where: { id: car.id } });
  await deleteUploadedImages(car.images.map((image) => image.url));

  refresh();
  return { ok: true };
}

export async function setCarStatus(carId, status, note = "") {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return { ok: false, error: "Admins only" };

  if (!["approved", "rejected", "pending"].includes(status)) {
    return { ok: false, error: "Unknown status" };
  }

  const statusNote =
    status === "rejected" ? String(note ?? "").trim().slice(0, 500) || null : null;

  await prisma.car.update({
    where: { id: Number(carId) },
    data: { status, statusNote },
  });

  refresh();
  return { ok: true };
}
